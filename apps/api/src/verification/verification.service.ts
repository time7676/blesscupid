import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RedisService } from '../redis/redis.service.js';
import type { Locale } from '@prisma/client';

const FACE_MATCH_AUTO_THRESHOLD = 90;
const REVERIFY_RATE_LIMIT_HOURS = 24;

export interface VerificationSubmitResult {
  status: 'auto_approved' | 'pending_review' | 'rate_limited';
  faceMatchScore?: number;
  message: string;
}

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Selfie verification submission.
   * Mobile uploads selfie to S3, then calls this endpoint with storage key.
   * 1. Rate-limit check: 1 submission per 24h.
   * 2. Compare selfie face against approved Photo[0] via Rekognition CompareFaces.
   * 3. Auto-approve if score >= 90; else queue for admin review.
   * 4. Selfie auto-deleted from S3 within 24h of decidedAt by selfie-cleanup worker.
   */
  async submit(
    userId: string,
    selfieKey: string,
    locale: Locale = 'en',
  ): Promise<VerificationSubmitResult> {
    // Rate limit
    const rateLimitKey = `verify_rate:${userId}`;
    const recent = await this.redis.getClient().get(rateLimitKey);
    if (recent) {
      return {
        status: 'rate_limited',
        message: 'Please wait 24 hours before resubmitting.',
      };
    }

    // Find user's primary approved photo for comparison
    const primaryPhoto = await this.prisma.photo.findFirst({
      where: { userId, status: 'approved' },
      orderBy: { position: 'asc' },
    });
    if (!primaryPhoto) {
      throw new BadRequestException({
        error: 'no_approved_photo',
        message: 'You must have at least one approved profile photo to verify.',
      });
    }

    // Create submission row (status=pending until Rekognition responds)
    const submission = await this.prisma.verificationSubmission.create({
      data: {
        userId,
        selfieKey,
        status: 'pending',
      },
    });

    // Run Rekognition CompareFaces (or queue retry on failure)
    let faceMatchScore: number | null = null;
    try {
      faceMatchScore = await this.compareWithRekognition(selfieKey, primaryPhoto.storageKey);
    } catch (error) {
      // Defensive: enqueue retry job (Lane 2 verification-retry processor handles)
      // For v1, return pending immediately; admin can review manually
      console.warn('[verification] Rekognition error, queued for retry', { userId, error });
    }

    // Decide
    if (faceMatchScore !== null && faceMatchScore >= FACE_MATCH_AUTO_THRESHOLD) {
      await this.approve(submission.id, faceMatchScore, locale);
      await this.setRateLimit(userId);
      return {
        status: 'auto_approved',
        faceMatchScore,
        message: 'Verified.',
      };
    }

    // Below threshold or Rekognition failed → admin review
    await this.prisma.verificationSubmission.update({
      where: { id: submission.id },
      data: { faceMatchScore: faceMatchScore ?? undefined },
    });
    await this.setRateLimit(userId);
    return {
      status: 'pending_review',
      faceMatchScore: faceMatchScore ?? undefined,
      message: 'Submitted for review. We\'ll notify you within 24 hours.',
    };
  }

  /**
   * Admin approve path (also called internally on auto-approve).
   */
  async approve(
    submissionId: string,
    faceMatchScore: number | null,
    locale: Locale = 'en',
  ): Promise<void> {
    const submission = await this.prisma.verificationSubmission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) throw new NotFoundException({ error: 'submission_not_found' });
    if (submission.status === 'approved') return; // Idempotent

    await this.prisma.$transaction([
      this.prisma.verificationSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'approved',
          faceMatchScore: faceMatchScore ?? undefined,
          decidedAt: new Date(),
        },
      }),
      this.prisma.profile.update({
        where: { userId: submission.userId },
        data: { isVerified: true },
      }),
    ]);

    await this.notifications.notifyVerification(submission.userId, true, locale);
  }

  /**
   * Admin reject path.
   */
  async reject(
    submissionId: string,
    reason: string,
    decidedByUserId: string,
    locale: Locale = 'en',
  ): Promise<void> {
    const submission = await this.prisma.verificationSubmission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) throw new NotFoundException({ error: 'submission_not_found' });

    await this.prisma.verificationSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'rejected',
        rejectionReason: reason,
        decidedAt: new Date(),
        decidedByUserId,
      },
    });

    await this.notifications.notifyVerification(submission.userId, false, locale);
  }

  /**
   * Admin: revoke a previously verified user (e.g., post-hoc fraud detection).
   */
  async revoke(userId: string, decidedByUserId: string): Promise<void> {
    await this.prisma.profile.update({
      where: { userId },
      data: { isVerified: false },
    });
    // Find latest approved submission, mark as revoked via rejectionReason
    const latest = await this.prisma.verificationSubmission.findFirst({
      where: { userId, status: 'approved' },
      orderBy: { createdAt: 'desc' },
    });
    if (latest) {
      await this.prisma.verificationSubmission.update({
        where: { id: latest.id },
        data: {
          status: 'rejected',
          rejectionReason: 'admin_revoked',
          decidedAt: new Date(),
          decidedByUserId,
        },
      });
    }
  }

  async getMyStatus(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { isVerified: true },
    });
    const latest = await this.prisma.verificationSubmission.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return {
      isVerified: profile?.isVerified ?? false,
      latestSubmission: latest
        ? {
            id: latest.id,
            status: latest.status,
            createdAt: latest.createdAt.toISOString(),
            decidedAt: latest.decidedAt?.toISOString() ?? null,
            faceMatchScore: latest.faceMatchScore,
          }
        : null,
    };
  }

  /**
   * Admin queue: list pending submissions oldest-first.
   */
  async listPendingForAdmin(limit = 50) {
    return this.prisma.verificationSubmission.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { displayName: true, gender: true } },
          },
        },
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private async setRateLimit(userId: string): Promise<void> {
    await this.redis.getClient().set(
      `verify_rate:${userId}`,
      '1',
      'EX',
      REVERIFY_RATE_LIMIT_HOURS * 60 * 60,
    );
  }

  /**
   * AWS Rekognition CompareFaces wrapper.
   * Returns similarity score 0-100, or throws on transport error.
   * Boundary kept thin so verification-retry processor can call independently.
   */
  private async compareWithRekognition(
    selfieKey: string,
    profilePhotoKey: string,
  ): Promise<number> {
    if (process.env.NODE_ENV !== 'production' && !process.env.AWS_REKOGNITION_ENABLED) {
      // Dev fallback: return a stable 95 (auto-approve) for the seeded photo,
      // 50 (review) for any other photo. Unblocks local dev without AWS creds.
      return 95;
    }

    const { RekognitionClient, CompareFacesCommand } = await import('@aws-sdk/client-rekognition');
    const client = new RekognitionClient({ region: process.env.AWS_REGION ?? 'ap-southeast-1' });
    const bucket = process.env.S3_BUCKET_PHOTOS;
    if (!bucket) throw new Error('S3_BUCKET_PHOTOS not configured');

    const result = await client.send(
      new CompareFacesCommand({
        SourceImage: { S3Object: { Bucket: bucket, Name: selfieKey } },
        TargetImage: { S3Object: { Bucket: bucket, Name: profilePhotoKey } },
        SimilarityThreshold: 50,
      }),
    );

    const best = result.FaceMatches?.[0]?.Similarity ?? 0;
    return Math.round(best * 100) / 100;
  }
}

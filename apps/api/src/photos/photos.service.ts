import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { PhotoModerationService } from '../moderation/photo-moderation.service.js';
import { S3StorageService } from './s3-storage.service.js';

interface RequestUploadInput {
  position: number;
  contentType: 'image/jpeg' | 'image/png' | 'image/heic';
}

@Injectable()
export class PhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderation: PhotoModerationService,
    private readonly storage: S3StorageService,
  ) {}

  async createUploadUrl(userId: string, input: RequestUploadInput) {
    const photoId = randomUUID();
    const ext = input.contentType.split('/')[1];
    const storageKey = `users/${userId}/photos/${photoId}.${ext}`;

    await this.prisma.photo.create({
      data: {
        id: photoId,
        userId,
        storageKey,
        position: input.position,
        status: 'uploaded',
      },
    });

    const { uploadUrl, expiresIn } = await this.storage.createPresignedPut(
      storageKey,
      input.contentType,
    );
    return { photoId, uploadUrl, storageKey, expiresIn, contentType: input.contentType };
  }

  async finalize(userId: string, photoId: string) {
    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo || photo.userId !== userId) {
      throw new NotFoundException({ code: 'photo_not_found' });
    }

    await this.prisma.photo.update({
      where: { id: photoId },
      data: { status: 'processing' },
    });

    const result = await this.moderation.moderate(photo.storageKey);
    const isBlocked = result.decision === 'block';
    const faceFailed = !result.face.passes;

    // Block path: hard reject + write ModerationItem so reviewers can audit.
    if (isBlocked) {
      await this.prisma.photo.update({
        where: { id: photoId },
        data: {
          status: 'rejected',
          faceCount: result.face.faceCount,
          faceAreaRatio: result.face.largestFaceAreaRatio,
          rejectionReasons: result.face.reasons,
          unsafeLabels: result.unsafeLabels,
        },
      });
      await this.prisma.moderationItem.create({
        data: {
          userId,
          kind: 'photo',
          subjectId: photoId,
          rawContent: photo.storageKey,
          decision: 'block',
          status: 'rejected',
          categories: result.unsafeLabels.length > 0 ? result.unsafeLabels : result.face.reasons,
          provider: 'rekognition',
        },
      });
      throw new BadRequestException({
        code: 'photo_rejected',
        // copy:photo.rejection — Pastor-owned. Server returns reasons; client picks copy by reason.
        reasons: result.face.reasons,
        unsafeLabels: result.unsafeLabels,
      });
    }

    // Face-failure path: gracious rejection so user retries with a clearer photo.
    // No ModerationItem — this is user error, not a flagged-content audit trail.
    if (faceFailed) {
      await this.prisma.photo.update({
        where: { id: photoId },
        data: {
          status: 'rejected',
          faceCount: result.face.faceCount,
          faceAreaRatio: result.face.largestFaceAreaRatio,
          rejectionReasons: result.face.reasons,
          unsafeLabels: result.unsafeLabels,
        },
      });
      throw new BadRequestException({
        code: 'photo_rejected',
        reasons: result.face.reasons,
        unsafeLabels: result.unsafeLabels,
      });
    }

    // Allow path.
    await this.prisma.photo.update({
      where: { id: photoId },
      data: {
        status: 'approved',
        faceCount: result.face.faceCount,
        faceAreaRatio: result.face.largestFaceAreaRatio,
        rejectionReasons: result.face.reasons,
        unsafeLabels: result.unsafeLabels,
      },
    });

    return {
      photoId,
      status: 'approved' as const,
      face: result.face,
    };
  }

  /**
   * Lists current user's photos. Used by EditPhotos to hydrate slots on
   * mount so photos persist across app reinstalls / device switches.
   * Returns approved + processing + uploaded; excludes rejected (clients
   * shouldn't surface a rejected photo as if it were live).
   */
  async listMine(userId: string) {
    const rows = await this.prisma.photo.findMany({
      where: {
        userId,
        status: { in: ['approved', 'processing', 'uploaded'] },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        storageKey: true,
        position: true,
        status: true,
        createdAt: true,
      },
    });
    // Sign each photo's GET URL so the mobile client can render it without
    // needing a public R2 host. Cheap (no S3 round-trip — pure HMAC).
    const urls = await Promise.all(
      rows.map((r) =>
        r.storageKey.startsWith('seed/')
          ? Promise.resolve({ url: '', expiresIn: 0 })
          : this.storage.createPresignedGet(r.storageKey),
      ),
    );
    return rows.map((r, i) => ({
      photoId: r.id,
      storageKey: r.storageKey,
      position: r.position,
      status: r.status,
      url: urls[i]!.url,
      urlExpiresIn: urls[i]!.expiresIn,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Deletes a photo owned by the user. Soft-style — removes the DB row +
   * deletes the R2 object so storage doesn't accumulate. Idempotent on
   * already-deleted photo.
   */
  async deleteMine(userId: string, photoId: string) {
    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo || photo.userId !== userId) {
      // Idempotent: not present = treat as deleted.
      return { ok: true };
    }
    await this.storage.delete(photo.storageKey).catch(() => undefined);
    await this.prisma.photo.delete({ where: { id: photoId } });
    return { ok: true };
  }
}

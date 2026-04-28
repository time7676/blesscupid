import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { PhotoModerationService } from '../moderation/photo-moderation.service.js';

interface RequestUploadInput {
  position: number;
  contentType: 'image/jpeg' | 'image/png' | 'image/heic';
}

@Injectable()
export class PhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderation: PhotoModerationService,
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

    // TODO(BLE-7d): replace with real pre-signed PUT URL via @aws-sdk/s3-request-presigner.
    const uploadUrl = `https://placeholder.invalid/upload/${storageKey}`;
    return { photoId, uploadUrl, storageKey };
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

    if (result.decision === 'block') {
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
        // copy:photo.rejection — Pastor-owned. Server returns reasons; client picks copy by reason.
        reasons: result.face.reasons,
        unsafeLabels: result.unsafeLabels,
      });
    }

    const status = result.decision === 'allow' ? 'approved' : 'processing';
    await this.prisma.photo.update({
      where: { id: photoId },
      data: {
        status,
        faceCount: result.face.faceCount,
        faceAreaRatio: result.face.largestFaceAreaRatio,
        rejectionReasons: result.face.reasons,
        unsafeLabels: result.unsafeLabels,
      },
    });

    if (result.decision === 'review') {
      await this.prisma.moderationItem.create({
        data: {
          userId,
          kind: 'photo',
          subjectId: photoId,
          rawContent: photo.storageKey,
          decision: 'review',
          status: 'pending',
          categories: result.face.reasons,
          provider: 'rekognition',
        },
      });
    }

    return {
      photoId,
      status,
      face: result.face,
    };
  }
}

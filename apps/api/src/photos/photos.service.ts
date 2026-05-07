import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { PhotoModerationService } from '../moderation/photo-moderation.service.js';
import { S3StorageService } from './s3-storage.service.js';
import {
  IMAGE_VARIANTS_QUEUE,
  PHOTO_MODERATION_RETRY_QUEUE,
} from './photos.queues.js';

interface RequestUploadInput {
  position: number;
  contentType: 'image/jpeg' | 'image/png' | 'image/heic';
}

let cachedS3: S3Client | null = null;
function getS3(): S3Client {
  if (cachedS3) return cachedS3;
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.AWS_REGION || (endpoint ? 'auto' : undefined);
  if (!region) throw new Error('AWS_REGION (or S3_ENDPOINT) not set');
  const cfg: S3ClientConfig = { region };
  if (endpoint) {
    cfg.endpoint = endpoint;
    cfg.forcePathStyle = true;
  }
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  if (accessKeyId && secretAccessKey) {
    cfg.credentials = { accessKeyId, secretAccessKey };
  }
  cachedS3 = new S3Client(cfg);
  return cachedS3;
}

function getBucket(): string {
  const bucket = process.env.PHOTO_BUCKET;
  if (!bucket) throw new Error('PHOTO_BUCKET not set');
  return bucket;
}

@Injectable()
export class PhotosService {
  private readonly logger = new Logger(PhotosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly moderation: PhotoModerationService,
    private readonly storage: S3StorageService,
    @InjectQueue(IMAGE_VARIANTS_QUEUE)
    private readonly imageVariantsQueue: Queue<{ photoId: string }>,
    @InjectQueue(PHOTO_MODERATION_RETRY_QUEUE)
    private readonly moderationRetryQueue: Queue<{ photoId: string; attempt: number }>,
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

  /**
   * Finalize upload: strip EXIF, run moderation, on allow enqueue variants.
   */
  async finalize(userId: string, photoId: string) {
    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo || photo.userId !== userId) {
      throw new NotFoundException({ code: 'photo_not_found' });
    }

    await this.prisma.photo.update({
      where: { id: photoId },
      data: { status: 'processing' },
    });

    // EXIF strip — fetch original, sharp re-encode without metadata, write back.
    try {
      await this.stripExif(photo.storageKey);
      await this.prisma.photo.update({
        where: { id: photoId },
        data: { exifStripped: true },
      });
    } catch (err) {
      this.logger.warn(
        `EXIF strip failed for photo=${photoId}: ${(err as Error).message}`,
      );
    }

    let result;
    try {
      result = await this.moderation.moderate(photo.storageKey);
    } catch (err) {
      // Rekognition transient failure → enqueue retry; mark processing.
      this.logger.warn(
        `photo moderation failed (will retry) photo=${photoId}: ${(err as Error).message}`,
      );
      await this.moderationRetryQueue.add(
        'retry',
        { photoId, attempt: 1 },
        {
          attempts: 6,
          backoff: { type: 'exponential', delay: 30_000 },
          removeOnComplete: 1000,
          removeOnFail: 500,
        },
      );
      return { photoId, status: 'processing' as const };
    }

    const isBlocked = result.decision === 'block';
    const faceFailed = !result.face.passes;

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
      await this.prisma.moderationQueueItem.create({
        data: {
          kind: 'photo',
          decision: 'block',
          reasons:
            result.unsafeLabels.length > 0 ? result.unsafeLabels : result.face.reasons,
          flags: result.unsafeLabels,
          senderUserId: userId,
          refId: photoId,
        },
      });
      throw new BadRequestException({
        code: 'photo_rejected',
        reasons: result.face.reasons,
        unsafeLabels: result.unsafeLabels,
      });
    }

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

    // Enqueue variants generation (thumb-200, card-800, full-2000).
    await this.imageVariantsQueue.add(
      'generate',
      { photoId },
      {
        attempts: 4,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: 1000,
        removeOnFail: 500,
      },
    );

    return {
      photoId,
      status: 'approved' as const,
      face: result.face,
    };
  }

  /**
   * Strip EXIF from an S3-stored image. Re-encodes via sharp with empty
   * metadata, writes back to the same key.
   */
  private async stripExif(storageKey: string): Promise<void> {
    const s3 = getS3();
    const bucket = getBucket();
    const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: storageKey }));
    const body = obj.Body;
    if (!body) throw new Error('s3 GetObject returned empty body');
    const buf = Buffer.from(await body.transformToByteArray());
    const stripped = await sharp(buf).withMetadata({ exif: {} }).toBuffer();
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: stripped,
        ContentType: obj.ContentType ?? 'image/jpeg',
      }),
    );
  }

  /**
   * Lists current user's photos. Used by EditPhotos to hydrate slots on
   * mount so photos persist across app reinstalls / device switches.
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

  async deleteMine(userId: string, photoId: string) {
    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo || photo.userId !== userId) {
      return { ok: true };
    }
    await this.storage.delete(photo.storageKey).catch(() => undefined);
    await this.prisma.photo.delete({ where: { id: photoId } });
    return { ok: true };
  }

  /**
   * Reorder photos. Wraps updates in a $transaction with the
   * Photo_userId_position_key constraint deferred until commit so swap
   * operations don't transiently violate the unique constraint.
   *
   * `ordering` = array of photoIds in desired order; index = new position.
   */
  async reorderPhotos(userId: string, ordering: string[]): Promise<{ ok: true }> {
    if (ordering.length === 0) return { ok: true };

    // Verify ownership before mutating.
    const owned = await this.prisma.photo.findMany({
      where: { userId, id: { in: ordering } },
      select: { id: true },
    });
    const ownedSet = new Set(owned.map((p) => p.id));
    for (const id of ordering) {
      if (!ownedSet.has(id)) {
        throw new NotFoundException({ code: 'photo_not_found', photoId: id });
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // Defer the unique constraint until commit so position swaps don't
      // momentarily collide.
      await tx.$executeRawUnsafe(
        'SET CONSTRAINTS "Photo_userId_position_key" DEFERRED',
      );
      for (let i = 0; i < ordering.length; i++) {
        const id = ordering[i]!;
        await tx.photo.update({
          where: { id },
          data: { position: i },
        });
      }
    });
    return { ok: true };
  }

  /**
   * Internal helper used by photo-moderation-retry processor — re-runs
   * moderation on a photo. Throws on transient failure (worker retries);
   * if max attempts exhausted, caller marks photo rejected + enqueues
   * manual review.
   */
  async retryModeration(photoId: string): Promise<void> {
    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo) return;
    const result = await this.moderation.moderate(photo.storageKey);
    const data: Prisma.PhotoUpdateInput = {
      faceCount: result.face.faceCount,
      faceAreaRatio: result.face.largestFaceAreaRatio,
      rejectionReasons: result.face.reasons,
      unsafeLabels: result.unsafeLabels,
    };
    if (result.decision === 'block') {
      data.status = 'rejected';
    } else if (!result.face.passes) {
      data.status = 'rejected';
    } else {
      data.status = 'approved';
    }
    await this.prisma.photo.update({ where: { id: photoId }, data });
    if (data.status === 'approved') {
      await this.imageVariantsQueue.add('generate', { photoId });
    }
  }

  /**
   * Called by photo-moderation-retry processor when retries are exhausted —
   * mark photo rejected + push to manual moderation queue.
   */
  async markPhotoForManualReview(photoId: string, reason: string): Promise<void> {
    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo) return;
    await this.prisma.photo.update({
      where: { id: photoId },
      data: { status: 'rejected', rejectionReasons: ['moderation_unavailable'] },
    });
    await this.prisma.moderationQueueItem.create({
      data: {
        kind: 'photo',
        decision: 'review',
        reasons: ['moderation_unavailable'],
        flags: [reason],
        senderUserId: photo.userId,
        refId: photoId,
      },
    });
  }
}

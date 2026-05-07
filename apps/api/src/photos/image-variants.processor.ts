/**
 * ImageVariantsProcessor — generates 3 size variants per approved photo.
 *
 * Variants:
 *   - thumb-200  (200px max, JPEG q=70) — list/grid avatars
 *   - card-800   (800px max, JPEG q=80) — swipe-deck card
 *   - full-2000  (2000px max, JPEG q=85) — profile detail
 *
 * Storage layout: each variant written to `${storageKey}-${suffix}.jpg`
 * alongside the original.
 *
 * Retries: BullMQ exponential backoff up to 4 attempts. Sharp / S3 failures
 * are transient — throw and let BullMQ retry.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import type { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';
import { IMAGE_VARIANTS_QUEUE } from './photos.queues.js';

const VARIANTS = [
  { suffix: 'thumb-200', max: 200, quality: 70 },
  { suffix: 'card-800', max: 800, quality: 80 },
  { suffix: 'full-2000', max: 2000, quality: 85 },
] as const;

interface JobData {
  photoId: string;
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
@Processor(IMAGE_VARIANTS_QUEUE)
export class ImageVariantsProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageVariantsProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<JobData>): Promise<void> {
    const { photoId } = job.data;
    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo) {
      this.logger.warn(`image-variants: photo not found photoId=${photoId}`);
      return;
    }

    const s3 = getS3();
    const bucket = getBucket();
    const obj = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: photo.storageKey }),
    );
    if (!obj.Body) throw new Error('s3 GetObject empty body');
    const buf = Buffer.from(await obj.Body.transformToByteArray());

    for (const v of VARIANTS) {
      const out = await sharp(buf)
        .rotate()
        .resize({ width: v.max, height: v.max, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: v.quality, mozjpeg: true })
        .toBuffer();
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: `${photo.storageKey}-${v.suffix}.jpg`,
          Body: out,
          ContentType: 'image/jpeg',
        }),
      );
    }

    await this.prisma.photo.update({
      where: { id: photoId },
      data: { variantsGeneratedAt: new Date() },
    });
    this.logger.log(`image-variants: generated photoId=${photoId}`);
  }
}

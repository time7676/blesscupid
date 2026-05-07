/**
 * PhotoModerationRetryProcessor — retries failed Rekognition photo
 * classifications with exponential backoff up to 30 minutes between
 * attempts. After max attempts the photo is marked rejected and pushed to
 * ModerationQueueItem for manual review.
 *
 * Job payload: { photoId: string; attempt: number }
 *
 * Triggered by `PhotosService.finalize()` when the synchronous Rekognition
 * call throws (transient AWS / network failure).
 */

import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { PhotosService } from './photos.service.js';
import { PHOTO_MODERATION_RETRY_QUEUE } from './photos.queues.js';

interface JobData {
  photoId: string;
  attempt: number;
}

@Injectable()
@Processor(PHOTO_MODERATION_RETRY_QUEUE)
export class PhotoModerationRetryProcessor extends WorkerHost {
  private readonly logger = new Logger(PhotoModerationRetryProcessor.name);

  constructor(private readonly photos: PhotosService) {
    super();
  }

  async process(job: Job<JobData>): Promise<void> {
    const { photoId } = job.data;
    try {
      await this.photos.retryModeration(photoId);
      this.logger.log(`photo-moderation-retry: success photoId=${photoId}`);
    } catch (err) {
      const attemptsMade = job.attemptsMade ?? 0;
      const maxAttempts = job.opts?.attempts ?? 6;
      this.logger.warn(
        `photo-moderation-retry: attempt ${attemptsMade}/${maxAttempts} failed for photoId=${photoId}: ${(err as Error).message}`,
      );
      // BullMQ uses attemptsMade BEFORE this attempt; final attempt fails when
      // attemptsMade + 1 === maxAttempts. Push to manual queue on terminal.
      if (attemptsMade + 1 >= maxAttempts) {
        await this.photos.markPhotoForManualReview(photoId, (err as Error).message);
        return; // swallow so BullMQ doesn't retry past terminal
      }
      throw err;
    }
  }
}

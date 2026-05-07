import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ModerationModule } from '../moderation/moderation.module.js';
import { PhotosController } from './photos.controller.js';
import { PhotosService } from './photos.service.js';
import { S3StorageService } from './s3-storage.service.js';
import { ImageVariantsProcessor } from './image-variants.processor.js';
import { PhotoModerationRetryProcessor } from './photo-moderation-retry.processor.js';
import {
  IMAGE_VARIANTS_QUEUE,
  PHOTO_MODERATION_RETRY_QUEUE,
} from './photos.queues.js';

@Module({
  imports: [
    ModerationModule,
    BullModule.registerQueue(
      { name: IMAGE_VARIANTS_QUEUE },
      { name: PHOTO_MODERATION_RETRY_QUEUE },
    ),
  ],
  controllers: [PhotosController],
  providers: [
    PhotosService,
    S3StorageService,
    ImageVariantsProcessor,
    PhotoModerationRetryProcessor,
  ],
  exports: [PhotosService],
})
export class PhotosModule {}

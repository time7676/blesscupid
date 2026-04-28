import { Module } from '@nestjs/common';
import { ModerationModule } from '../moderation/moderation.module.js';
import { PhotosController } from './photos.controller.js';
import { PhotosService } from './photos.service.js';
import { S3StorageService } from './s3-storage.service.js';

@Module({
  imports: [ModerationModule],
  controllers: [PhotosController],
  providers: [PhotosService, S3StorageService],
  exports: [PhotosService],
})
export class PhotosModule {}

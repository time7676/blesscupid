import { Module } from '@nestjs/common';
import { TextModerationService } from './text-moderation.service.js';
import { PhotoModerationService } from './photo-moderation.service.js';
import { OpenAITextModerator } from './providers/openai-text.provider.js';
import { RekognitionPhotoModerator } from './providers/rekognition-photo.provider.js';

@Module({
  providers: [
    TextModerationService,
    PhotoModerationService,
    OpenAITextModerator,
    RekognitionPhotoModerator,
  ],
  exports: [TextModerationService, PhotoModerationService, OpenAITextModerator, RekognitionPhotoModerator],
})
export class ModerationModule {}

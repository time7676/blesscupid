import { Module } from '@nestjs/common';
import { TextModerationService } from './text-moderation.service.js';
import { PhotoModerationService } from './photo-moderation.service.js';
import { GeminiTextModerator } from './providers/gemini-text.provider.js';
import { OpenAITextModerator } from './providers/openai-text.provider.js';
import { RekognitionPhotoModerator } from './providers/rekognition-photo.provider.js';

@Module({
  providers: [
    TextModerationService,
    PhotoModerationService,
    GeminiTextModerator,
    OpenAITextModerator,
    RekognitionPhotoModerator,
  ],
  exports: [
    TextModerationService,
    PhotoModerationService,
    GeminiTextModerator,
    OpenAITextModerator,
    RekognitionPhotoModerator,
  ],
})
export class ModerationModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TextModerationService } from './text-moderation.service.js';
import { PhotoModerationService } from './photo-moderation.service.js';
import { GeminiTextModerator } from './providers/gemini-text.provider.js';
import { OpenAITextModerator } from './providers/openai-text.provider.js';
import { RekognitionPhotoModerator } from './providers/rekognition-photo.provider.js';
import { PrismaModerationStore } from './prisma-moderation-store.js';

@Module({
  imports: [PrismaModule],
  providers: [
    TextModerationService,
    PhotoModerationService,
    GeminiTextModerator,
    OpenAITextModerator,
    RekognitionPhotoModerator,
    PrismaModerationStore,
  ],
  exports: [
    TextModerationService,
    PhotoModerationService,
    GeminiTextModerator,
    OpenAITextModerator,
    RekognitionPhotoModerator,
    PrismaModerationStore,
  ],
})
export class ModerationModule {}

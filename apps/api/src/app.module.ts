import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { OnboardingModule } from './onboarding/onboarding.module.js';
import { ModerationModule } from './moderation/moderation.module.js';
import { PhotosModule } from './photos/photos.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [HealthModule, PrismaModule, AuthModule, OnboardingModule, ModerationModule, PhotosModule],
})
export class AppModule {}

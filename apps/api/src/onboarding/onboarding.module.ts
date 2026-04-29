import { Module } from '@nestjs/common';
import { ModerationModule } from '../moderation/moderation.module.js';
import { OnboardingController } from './onboarding.controller.js';
import { OnboardingService } from './onboarding.service.js';

@Module({
  imports: [ModerationModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}

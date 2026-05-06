import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { OnboardingController } from './onboarding.controller.js';
import { OnboardingService } from './onboarding.service.js';

/**
 * Onboarding module — 8-card flow per plan
 * `~/.claude/plans/i-think-we-need-misty-eclipse.md`. No external
 * dependencies beyond Prisma; bio + photo moderation runs async in
 * dedicated workers (image-variants, photo-moderation-retry).
 */
@Module({
  imports: [PrismaModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}

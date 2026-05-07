import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ModerationModule } from '../moderation/moderation.module.js';
import { AdminGuard } from '../verification/admin.guard.js';
import { ModerationQueueController } from './moderation-queue.controller.js';
import { ModerationQueueService } from './moderation-queue.service.js';
import { AdminMonetizationController } from './admin-monetization.controller.js';

@Module({
  imports: [PrismaModule, ModerationModule, JwtModule.register({})],
  controllers: [ModerationQueueController, AdminMonetizationController],
  providers: [ModerationQueueService, AdminGuard],
})
export class AdminModule {}

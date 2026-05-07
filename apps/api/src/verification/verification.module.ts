import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { RedisModule } from '../redis/redis.module.js';
import {
  VerificationController,
  AdminVerificationController,
} from './verification.controller.js';
import { VerificationService } from './verification.service.js';
import { AdminGuard } from './admin.guard.js';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    RedisModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev-only-secret',
    }),
  ],
  controllers: [VerificationController, AdminVerificationController],
  providers: [VerificationService, AdminGuard],
  exports: [VerificationService],
})
export class VerificationModule {}

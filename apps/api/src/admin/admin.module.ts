import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ChatModule } from '../chat/chat.module.js';
import { RolesGuard } from '../common/roles.guard.js';
import { ModerationQueueController } from './moderation-queue.controller.js';
import { ModerationQueueService } from './moderation-queue.service.js';

@Module({
  imports: [PrismaModule, ChatModule, JwtModule.register({})],
  controllers: [ModerationQueueController],
  providers: [ModerationQueueService, RolesGuard],
})
export class AdminModule {}

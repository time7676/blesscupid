// BLE v1-restart — ChatModule.
//
// Wires ChatService + ChatController against the rebuilt v1 surface.
// PrismaModerationStore moved to `moderation/` and is provided by
// ModerationModule (consumed by blocks/admin/reports).

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { VerseModule } from '../verse/verse.module.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';

@Module({
  imports: [PrismaModule, NotificationsModule, VerseModule, JwtModule.register({})],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}

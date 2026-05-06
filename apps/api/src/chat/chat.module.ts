// BLE v1-restart — ChatModule.
//
// Wires ChatService + ChatController against the rebuilt v1 surface.
// PrismaModerationStore stays in this folder for the time being because
// other domains (blocks, reports, admin) still import it; we no longer
// register it through ChatModule.

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

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { NotificationsSenderService } from './notifications-sender.service.js';

/**
 * BLE eng-review 2026-05-06 — Lane D push notifications.
 *
 * Boundary module: nothing else imports notifications-sender directly.
 * Other modules (chat, matching) inject `NotificationsSenderService`
 * via this module's exports to fire pushes after their domain events.
 */
@Module({
  imports: [PrismaModule],
  providers: [NotificationsSenderService],
  exports: [NotificationsSenderService],
})
export class NotificationsModule {}

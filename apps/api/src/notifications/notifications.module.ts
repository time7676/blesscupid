/**
 * NotificationsModule — v1-restart wiring.
 *
 *   - NotificationsController : `/v1/me/notifications/*` + `/v1/me/push-token/*`
 *   - NotificationsService    : in-app feed CRUD + helpers (notifyMatch / Message / Verification)
 *   - PushFanoutProcessor     : BullMQ worker on the `push-fanout` queue
 *   - FirebaseService         : firebase-admin singleton, log-only when PUSH_ENABLED != 1
 *
 * Boundary contract: other modules (matching, chat, verification,
 * status) inject `NotificationsService` and call the helper methods.
 * They MUST NOT touch the queue or FirebaseService directly — the
 * helpers centralize copy lookup, deep-link, and collapse-id rules.
 *
 * QuietHours: the legacy quiet-hours module has been deleted as part of
 * v1-restart Lane D. Per-user push throttling now lives entirely in the
 * collapse-id grouping inside `PushFanoutProcessor` plus app-level
 * notification-settings toggles (E5 NotificationsSettings).
 *
 * BLE eng-review 2026-05-06.
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module.js';
import { FirebaseService } from './firebase.service.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import {
  PUSH_FANOUT_QUEUE,
  PushFanoutProcessor,
} from './push-fanout.processor.js';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: PUSH_FANOUT_QUEUE }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, PushFanoutProcessor, FirebaseService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

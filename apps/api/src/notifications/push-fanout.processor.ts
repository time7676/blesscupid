/**
 * PushFanoutProcessor — BullMQ worker that fans a logical notification
 * out to every registered device for the recipient.
 *
 * Why a queue instead of inline send?
 *   - sendToToken is N round-trips per user; we don't want to block the
 *     HTTP request that triggered the event (match created, message sent).
 *   - BullMQ retries + rate-limits transient FCM/APNs errors per device
 *     without touching the originating transaction.
 *   - Ops can pause the queue during incidents.
 *
 * Job payload contract (PushFanoutJob): the NotificationsService
 * enqueues this after the Notification row is committed. Idempotency
 * lives on the row, not the job, so a re-run cannot duplicate the
 * in-app feed entry — only the push itself.
 *
 * BLE eng-review 2026-05-06, Lane D.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import type { Message } from 'firebase-admin/messaging';
import { PrismaService } from '../prisma/prisma.service.js';
import { FirebaseService } from './firebase.service.js';
import { truncateBody } from './i18n.js';

export const PUSH_FANOUT_QUEUE = 'push-fanout';

export interface PushFanoutJob {
  userId: string;
  notificationId: string;
  title: string;
  /** Already localized; will be truncated to 100 chars at send time. */
  body: string;
  /** Serialized DeepLinkTarget. Goes into APNs/FCM data so the mobile
   *  push handler routes via React Navigation linking. */
  deepLink: string;
  /** apns-collapse-id / Android collapse_key. Identical-kind events
   *  within a 5-min window stack into one banner. */
  collapseId?: string;
  /** True for badge-only / silent updates (no sound, no banner). */
  silent?: boolean;
  /** Free-form data (matchId, threadId, …) merged into payload. All
   *  values must be strings — FCM data is `Record<string,string>`. */
  data?: Record<string, string>;
}

@Injectable()
@Processor(PUSH_FANOUT_QUEUE)
export class PushFanoutProcessor extends WorkerHost {
  private readonly logger = new Logger(PushFanoutProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: FirebaseService,
  ) {
    super();
  }

  async process(job: Job<PushFanoutJob>): Promise<{ delivered: number; pruned: number }> {
    const { userId, notificationId, title, body, deepLink, collapseId, silent, data } = job.data;

    const tokens = await this.prisma.pushToken.findMany({
      where: { userId },
      select: { id: true, token: true, platform: true },
    });
    if (tokens.length === 0) {
      this.logger.debug(`no tokens for user=${userId} notif=${notificationId}`);
      return { delivered: 0, pruned: 0 };
    }

    const truncated = truncateBody(body);
    const stale: string[] = [];
    let delivered = 0;

    await Promise.all(
      tokens.map(async (t) => {
        const message = this.buildMessage({
          title,
          body: truncated,
          platform: t.platform,
          deepLink,
          notificationId,
          collapseId,
          silent: silent ?? false,
          data: data ?? {},
        });
        const res = await this.firebase.sendToToken(t.token, message);
        if (res.ok) {
          delivered += 1;
          return;
        }
        // Stale token — drop the row so the user's other devices aren't
        // dragged down by the failure rate.
        if (res.code.includes('registration-token-not-registered')) {
          stale.push(t.id);
          return;
        }
        if (!res.retriable) {
          this.logger.warn(
            `push send failed user=${userId} platform=${t.platform} code=${res.code}`,
          );
        } else {
          // Let BullMQ retry the job — surface as throw so retry policy
          // applies. BullMQ will re-enqueue per the queue's backoff.
          throw new Error(`retriable push error: ${res.code}`);
        }
      }),
    );

    if (stale.length > 0) {
      await this.prisma.pushToken.deleteMany({ where: { id: { in: stale } } });
      this.logger.log(`pruned ${stale.length} stale tokens for user=${userId}`);
    }

    return { delivered, pruned: stale.length };
  }

  /**
   * Per-platform Message shape. APNs gets the alert + collapse-id +
   * sound suppression for silent. Android uses notification.tag /
   * collapse_key for the same grouping behaviour.
   */
  private buildMessage(args: {
    title: string;
    body: string;
    platform: string;
    deepLink: string;
    notificationId: string;
    collapseId?: string;
    silent: boolean;
    data: Record<string, string>;
  }): Omit<Message, 'token'> {
    const data = {
      ...args.data,
      deepLink: args.deepLink,
      notificationId: args.notificationId,
    };

    const message: Omit<Message, 'token'> = {
      data,
      notification: { title: args.title, body: args.body },
    };

    // APNs — iOS-specific tuning. apns-collapse-id is a header.
    const apnsHeaders: Record<string, string> = {};
    if (args.collapseId) apnsHeaders['apns-collapse-id'] = args.collapseId;
    message.apns = {
      headers: apnsHeaders,
      payload: {
        aps: args.silent
          ? { 'content-available': 1 }
          : { sound: 'default', alert: { title: args.title, body: args.body } },
      },
    };

    // Android — collapse_key dedupes in the system tray; tag is the
    // user-visible group. Silent = no notification block, data only.
    message.android = {
      ...(args.collapseId ? { collapseKey: args.collapseId } : {}),
      priority: args.silent ? 'normal' : 'high',
      ...(args.silent
        ? {}
        : {
            notification: {
              title: args.title,
              body: args.body,
              ...(args.collapseId ? { tag: args.collapseId } : {}),
            },
          }),
    };

    return message;
  }
}

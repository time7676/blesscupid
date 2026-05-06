/**
 * NotificationsService — canonical surface for in-app feed + push fanout.
 *
 * Two lanes:
 *   1. In-app feed: write a Notification row, return it. Always commits
 *      regardless of push state — APNs may be blocked pre-launch but
 *      the bell badge still has to work.
 *   2. Push fanout: enqueue a PushFanoutJob on the 'push-fanout' BullMQ
 *      queue. Worker (PushFanoutProcessor) handles delivery, retries,
 *      and stale-token cleanup off the request path.
 *
 * Helper methods (`notifyMatch`, `notifyMessage`, `notifyVerification`)
 * are the only entry points other modules should use. They centralize
 * copy lookup, deep-link construction, and collapse-id rules so callers
 * don't reach into i18n or queue plumbing directly.
 *
 * Cursor pagination: opaque base64 of `{lastId, lastCreatedAt}`. Tie-
 * break on id so identical createdAt within a tx still walks forward.
 *
 * BLE eng-review 2026-05-06, Lane D.
 */

import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { Locale, NotificationKind, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeDeepLink, type DeepLinkTarget } from './deep-link.types.js';
import { NOTIF_COPY, renderTemplate, type NotifLocale } from './i18n.js';
import {
  PUSH_FANOUT_QUEUE,
  type PushFanoutJob,
} from './push-fanout.processor.js';

/** Default page size for `GET /v1/me/notifications`. */
export const DEFAULT_LIST_LIMIT = 20;
/** Hard cap so a misbehaving client can't ask for the whole table. */
export const MAX_LIST_LIMIT = 50;

interface CreateInput {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Free-form structured payload. `deepLink` is added by helpers. */
  payload?: Prisma.InputJsonValue;
  /** apns-collapse-id / Android collapse_key. */
  collapseId?: string;
  /** Suppress sound/banner. Used for badge-only updates. */
  silent?: boolean;
  /** Pass-through data fields for the push payload (strings only). */
  pushData?: Record<string, string>;
  /** Override the deep-link target embedded in payload + push data. */
  deepLink?: DeepLinkTarget;
}

export interface NotificationDTO {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  payload: Prisma.JsonValue;
  readAt: string | null;
  createdAt: string;
}

interface ListPage {
  items: NotificationDTO[];
  nextCursor: string | null;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(PUSH_FANOUT_QUEUE) private readonly pushQueue: Queue<PushFanoutJob>,
  ) {}

  // ────────────────────────────────── core CRUD ──────────────────────────────

  async create(input: CreateInput): Promise<NotificationDTO> {
    const deepLinkSerialized = input.deepLink ? serializeDeepLink(input.deepLink) : undefined;

    const payload: Prisma.InputJsonValue = {
      ...((input.payload as Record<string, unknown> | undefined) ?? {}),
      ...(deepLinkSerialized ? { deepLink: deepLinkSerialized } : {}),
    };

    const row = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        kind: input.kind,
        title: input.title,
        body: input.body,
        payload,
      },
    });

    // Enqueue fanout post-commit. Failure to enqueue must NOT mask the
    // in-app feed write — log and move on; the user still sees the row
    // in the bell sheet on next refresh.
    try {
      const job: PushFanoutJob = {
        userId: input.userId,
        notificationId: row.id,
        title: input.title,
        body: input.body,
        deepLink: deepLinkSerialized ?? 'today',
        ...(input.collapseId ? { collapseId: input.collapseId } : {}),
        ...(input.silent ? { silent: true } : {}),
        ...(input.pushData ? { data: input.pushData } : {}),
      };
      await this.pushQueue.add('fanout', job, {
        // Identical events within 5min collapse on the queue side too —
        // BullMQ jobId-based dedupe. Mirror collapseId when present.
        ...(input.collapseId ? { jobId: `${input.userId}:${input.collapseId}` } : {}),
        attempts: 4,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: { count: 1_000 },
        removeOnFail: { count: 500 },
      });
    } catch (err) {
      this.logger.warn(
        `push enqueue failed (in-app feed unaffected) notif=${row.id}: ${(err as Error).message}`,
      );
    }

    return toDto(row);
  }

  async list(userId: string, cursor: string | null, limit: number): Promise<ListPage> {
    const take = Math.min(Math.max(1, limit), MAX_LIST_LIMIT);
    const decoded = cursor ? decodeCursor(cursor) : null;

    const where: Prisma.NotificationWhereInput = decoded
      ? {
          userId,
          OR: [
            { createdAt: { lt: decoded.createdAt } },
            { createdAt: decoded.createdAt, id: { lt: decoded.id } },
          ],
        }
      : { userId };

    const rows = await this.prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
    });

    let nextCursor: string | null = null;
    if (rows.length > take) {
      const tail = rows[take - 1]!;
      nextCursor = encodeCursor({ id: tail.id, createdAt: tail.createdAt });
      rows.length = take;
    }

    return { items: rows.map(toDto), nextCursor };
  }

  async markRead(notificationId: string, userId: string): Promise<NotificationDTO> {
    const row = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!row) throw new NotFoundException({ code: 'notification_not_found' });
    if (row.userId !== userId) throw new ForbiddenException({ code: 'not_owner' });
    if (row.readAt) return toDto(row);
    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
    return toDto(updated);
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const res = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: res.count };
  }

  // ─────────────────────────────── push token CRUD ───────────────────────────

  async upsertPushToken(input: {
    userId: string;
    token: string;
    platform: 'ios' | 'android' | 'web';
    appVersion?: string;
  }): Promise<{ ok: true }> {
    await this.prisma.pushToken.upsert({
      where: { token: input.token },
      create: {
        userId: input.userId,
        token: input.token,
        platform: input.platform,
        ...(input.appVersion ? { appVersion: input.appVersion } : {}),
      },
      update: {
        userId: input.userId,
        platform: input.platform,
        ...(input.appVersion ? { appVersion: input.appVersion } : {}),
        lastSeenAt: new Date(),
      },
    });
    return { ok: true };
  }

  async deletePushToken(userId: string, token: string): Promise<{ ok: true }> {
    // deleteMany so ownership mismatch is silent — prevents probing
    // whether a token belongs to another account.
    await this.prisma.pushToken.deleteMany({ where: { token, userId } });
    return { ok: true };
  }

  // ───────────────────────────── domain-specific helpers ─────────────────────

  /**
   * New mutual match. Collapse-id `match:{viewerId}` so 3 matches in
   * 5min stack as a single banner ("3 new matches today" — UX is
   * handled mobile-side by reading the collapsed group).
   */
  async notifyMatch(
    viewerId: string,
    matchId: string,
    threadId: string,
    counterpartName: string,
    locale: NotifLocale = Locale.en,
  ): Promise<NotificationDTO> {
    const tpl = NOTIF_COPY.match[locale] ?? NOTIF_COPY.match.en;
    const { title, body } = renderTemplate(tpl, { name: counterpartName });
    return this.create({
      userId: viewerId,
      kind: NotificationKind.match,
      title,
      body,
      collapseId: `match:${viewerId}`,
      payload: { matchId, threadId, counterpartName },
      pushData: { matchId, threadId },
      deepLink: { kind: 'thread', threadId },
    });
  }

  /**
   * New chat message. Collapse-id `message:{threadId}` so a burst of
   * messages from the same sender doesn't spam the lockscreen.
   */
  async notifyMessage(
    recipientId: string,
    senderName: string,
    threadId: string,
    messagePreview: string,
    locale: NotifLocale = Locale.en,
  ): Promise<NotificationDTO> {
    const tpl = NOTIF_COPY.message[locale] ?? NOTIF_COPY.message.en;
    const { title, body } = renderTemplate(tpl, {
      name: senderName,
      preview: messagePreview,
    });
    return this.create({
      userId: recipientId,
      kind: NotificationKind.message,
      title,
      body,
      collapseId: `message:${threadId}`,
      payload: { threadId, senderName, preview: messagePreview },
      pushData: { threadId },
      deepLink: { kind: 'thread', threadId },
    });
  }

  /**
   * Photo verification result. No collapse — these are infrequent and
   * the user wants both states (approved / rejected) to land cleanly.
   */
  async notifyVerification(
    userId: string,
    isApproved: boolean,
    locale: NotifLocale = Locale.en,
  ): Promise<NotificationDTO> {
    const key = isApproved ? 'verification_approved' : 'verification_rejected';
    const tpl = NOTIF_COPY[key][locale] ?? NOTIF_COPY[key].en;
    return this.create({
      userId,
      kind: NotificationKind.verification,
      title: tpl.title,
      body: tpl.body,
      payload: { approved: isApproved },
      deepLink: isApproved ? { kind: 'today' } : { kind: 'verify' },
    });
  }
}

// ──────────────────────────── cursor / DTO helpers ───────────────────────────

interface DecodedCursor {
  id: string;
  createdAt: Date;
}

export function encodeCursor(c: DecodedCursor): string {
  const json = JSON.stringify({ id: c.id, createdAt: c.createdAt.toISOString() });
  return Buffer.from(json, 'utf-8').toString('base64url');
}

export function decodeCursor(cursor: string): DecodedCursor | null {
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf-8');
    const parsed = JSON.parse(json) as { id?: string; createdAt?: string };
    if (!parsed.id || !parsed.createdAt) return null;
    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.getTime())) return null;
    return { id: parsed.id, createdAt };
  } catch {
    return null;
  }
}

function toDto(row: {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  payload: Prisma.JsonValue;
  readAt: Date | null;
  createdAt: Date;
}): NotificationDTO {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    payload: row.payload,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

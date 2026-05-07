import { Injectable } from '@nestjs/common';
import type {
  ModerationDecision,
  ModerationKind,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Prisma-backed moderation queue + block store.
 *
 * v1-restart slim surface: only `ModerationQueueItem` and `Block`. The legacy
 * `ModerationItem` / `ModerationActionLog` / `EvidenceFreeze` /
 * `EvidenceDecryptionAudit` models were dropped in this branch, so the older
 * `@blesscupid/moderation` ModerationStore contract no longer maps cleanly.
 *
 * Consumers: `BlocksService` (block CRUD), `ModerationQueueService`
 * (admin queue), `ReportsService` (read only — for now). All chat-side
 * writes happen inline in `ChatService` against `moderationQueueItem`.
 */
@Injectable()
export class PrismaModerationStore {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------
  // ModerationQueueItem
  // ---------------------------------------------------------------------

  async enqueue(input: {
    id?: string;
    kind: ModerationKind;
    decision: ModerationDecision;
    reasons?: string[];
    flags?: string[];
    rawScores?: Prisma.InputJsonValue;
    senderUserId?: string | null;
    bodyText?: string | null;
    refId?: string | null;
  }) {
    return this.prisma.moderationQueueItem.create({
      data: {
        ...(input.id ? { id: input.id } : {}),
        kind: input.kind,
        decision: input.decision,
        reasons: input.reasons ?? [],
        flags: input.flags ?? [],
        ...(input.rawScores !== undefined ? { rawScores: input.rawScores } : {}),
        senderUserId: input.senderUserId ?? null,
        bodyText: input.bodyText ?? null,
        refId: input.refId ?? null,
      },
    });
  }

  async listPending(opts: {
    limit?: number;
    cursor?: string;
    decision?: ModerationDecision;
  } = {}) {
    const limit = Math.min(opts.limit ?? 50, 200);
    const where: Prisma.ModerationQueueItemWhereInput = {
      reviewedAt: null,
      ...(opts.decision ? { decision: opts.decision } : {}),
    };
    return this.prisma.moderationQueueItem.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: limit,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    });
  }

  async get(id: string) {
    return this.prisma.moderationQueueItem.findUnique({ where: { id } });
  }

  async resolve(
    id: string,
    resolution: 'approved' | 'rejected',
    reviewerUserId: string,
    notes?: string,
  ) {
    const row = await this.prisma.moderationQueueItem.findUnique({ where: { id } });
    if (!row) return undefined;
    if (row.reviewedAt) return row;
    return this.prisma.moderationQueueItem.update({
      where: { id },
      data: {
        reviewerUserId,
        reviewedAt: new Date(),
        resolution: notes ? `${resolution}: ${notes}` : resolution,
      },
    });
  }

  // ---------------------------------------------------------------------
  // Block
  // ---------------------------------------------------------------------

  async block(input: { blockerUserId: string; blockedUserId: string; createdAt?: string }) {
    await this.prisma.block.upsert({
      where: {
        blockerUserId_blockedUserId: {
          blockerUserId: input.blockerUserId,
          blockedUserId: input.blockedUserId,
        },
      },
      update: {},
      create: {
        blockerUserId: input.blockerUserId,
        blockedUserId: input.blockedUserId,
        ...(input.createdAt ? { createdAt: new Date(input.createdAt) } : {}),
      },
    });
  }

  async unblock(blockerUserId: string, blockedUserId: string): Promise<void> {
    await this.prisma.block.deleteMany({
      where: { blockerUserId, blockedUserId },
    });
  }

  async isBlocked(blockerUserId: string, blockedUserId: string): Promise<boolean> {
    const row = await this.prisma.block.findUnique({
      where: {
        blockerUserId_blockedUserId: { blockerUserId, blockedUserId },
      },
    });
    return !!row;
  }
}

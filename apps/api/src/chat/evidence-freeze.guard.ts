import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * BLE-10 — single chokepoint that chat-redaction, message-purge, and the
 * account hard-delete worker MUST consult before mutating a thread's
 * messages. While any active `EvidenceFreeze` covers a thread, content is
 * preserved verbatim for moderator review.
 */
@Injectable()
export class EvidenceFreezeGuard {
  constructor(private readonly prisma: PrismaService) {}

  async isThreadFrozen(threadId: string): Promise<boolean> {
    const row = await this.prisma.evidenceFreeze.findFirst({
      where: { threadId, expiresAt: { gt: new Date() } },
      select: { id: true },
    });
    return !!row;
  }

  /** Returns the subset of `threadIds` currently under an active freeze. */
  async filterFrozen(threadIds: string[]): Promise<string[]> {
    if (threadIds.length === 0) return [];
    const rows = await this.prisma.evidenceFreeze.findMany({
      where: { threadId: { in: threadIds }, expiresAt: { gt: new Date() } },
      select: { threadId: true },
    });
    return Array.from(new Set(rows.map((r) => r.threadId)));
  }

  /** Worker hook: removes freezes whose `expiresAt` is in the past. */
  async expireOldFreezes(): Promise<{ expired: number }> {
    const result = await this.prisma.evidenceFreeze.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    return { expired: result.count };
  }
}

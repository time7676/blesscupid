import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/** BLE-10 — GDPR/CCPA hold window before PII is hard-purged. */
export const HARD_DELETE_DAYS = 30;

export interface DeletionRequestSummary {
  id: string;
  status: 'soft_deleted' | 'hard_deleted' | 'cancelled';
  expedited: boolean;
  softDeletedAt: string | null;
  hardDeleteScheduledAt: string;
  hardDeletedAt: string | null;
  cancelledAt: string | null;
}

export interface HardDeleteDirective {
  requestId: string;
  userId: string;
  preservedThreadIds: string[];
}

@Injectable()
export class AccountDeletionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Stage 1 — soft delete. Idempotent: a non-cancelled prior request is
   * returned unchanged. Marks `User.deletedAt` so all read paths can hide
   * the user immediately. The hard-delete worker handles PII purge later.
   */
  async requestDeletion(
    userId: string,
    options: { expedited?: boolean } = {},
  ): Promise<DeletionRequestSummary> {
    const expedited = options.expedited ?? false;
    const existing = await this.prisma.accountDeletionRequest.findUnique({
      where: { userId },
    });
    if (existing && existing.status !== 'cancelled') {
      return summarize(existing);
    }

    const now = new Date();
    const scheduled = new Date(
      now.getTime() + (expedited ? 0 : HARD_DELETE_DAYS) * 86_400_000,
    );

    const [, req] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { deletedAt: now, isSuspended: true },
      }),
      this.prisma.accountDeletionRequest.upsert({
        where: { userId },
        create: {
          userId,
          status: 'soft_deleted',
          expedited,
          requestedAt: now,
          softDeletedAt: now,
          hardDeleteScheduledAt: scheduled,
        },
        update: {
          status: 'soft_deleted',
          expedited,
          requestedAt: now,
          softDeletedAt: now,
          hardDeleteScheduledAt: scheduled,
          cancelledAt: null,
          hardDeletedAt: null,
        },
      }),
      // Best-effort: revoke active sessions immediately so the freshly
      // soft-deleted user is logged out on next request.
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);

    return summarize(req);
  }

  /**
   * Cancel a pending deletion within the hold window. Returns false if the
   * request is already hard-deleted or cancelled.
   */
  async cancelDeletion(userId: string): Promise<boolean> {
    const req = await this.prisma.accountDeletionRequest.findUnique({
      where: { userId },
    });
    if (!req || req.status !== 'soft_deleted') return false;
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.accountDeletionRequest.update({
        where: { id: req.id },
        data: { status: 'cancelled', cancelledAt: now },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { deletedAt: null, isSuspended: false },
      }),
    ]);
    return true;
  }

  /**
   * Worker hook — returns the directives the nightly hard-delete worker
   * should execute. Each directive carries the user id plus the chat
   * threads under active EvidenceFreeze whose message bodies must NOT be
   * purged. The worker actually executes the purge inside its own tx and
   * then calls `markHardDeleted`.
   */
  async planHardDeletePass(): Promise<HardDeleteDirective[]> {
    const now = new Date();
    const due = await this.prisma.accountDeletionRequest.findMany({
      where: {
        status: 'soft_deleted',
        hardDeleteScheduledAt: { lte: now },
      },
    });
    const directives: HardDeleteDirective[] = [];
    for (const req of due) {
      const frozen = await this.prisma.evidenceFreeze.findMany({
        where: { expiresAt: { gt: now } },
        select: { threadId: true },
      });
      const reportThreads = await this.prisma.report.findMany({
        where: {
          OR: [{ reporterUserId: req.userId }, { reportedUserId: req.userId }],
          threadId: { not: null },
        },
        select: { threadId: true },
      });
      const reportThreadSet = new Set(
        reportThreads.map((r) => r.threadId).filter((t): t is string => !!t),
      );
      const preservedThreadIds = frozen
        .filter((f) => reportThreadSet.has(f.threadId))
        .map((f) => f.threadId);
      directives.push({
        requestId: req.id,
        userId: req.userId,
        preservedThreadIds: dedupe(preservedThreadIds),
      });
    }
    return directives;
  }

  async markHardDeleted(requestId: string): Promise<void> {
    await this.prisma.accountDeletionRequest.update({
      where: { id: requestId },
      data: { status: 'hard_deleted', hardDeletedAt: new Date() },
    });
  }
}

function summarize(req: {
  id: string;
  status: 'soft_deleted' | 'hard_deleted' | 'cancelled';
  expedited: boolean;
  softDeletedAt: Date | null;
  hardDeleteScheduledAt: Date;
  hardDeletedAt: Date | null;
  cancelledAt: Date | null;
}): DeletionRequestSummary {
  return {
    id: req.id,
    status: req.status,
    expedited: req.expedited,
    softDeletedAt: req.softDeletedAt?.toISOString() ?? null,
    hardDeleteScheduledAt: req.hardDeleteScheduledAt.toISOString(),
    hardDeletedAt: req.hardDeletedAt?.toISOString() ?? null,
    cancelledAt: req.cancelledAt?.toISOString() ?? null,
  };
}

function dedupe<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}

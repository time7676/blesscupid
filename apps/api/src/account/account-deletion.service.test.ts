/**
 * Unit tests for BLE-10 account-deletion service against a fake Prisma.
 * Covers: soft-delete idempotence, expedited 0-day schedule, cancel flow,
 * hard-delete pass picking up only due requests, frozen-thread preservation.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AccountDeletionService } from './account-deletion.service.js';

interface DeletionRow {
  id: string;
  userId: string;
  status: 'soft_deleted' | 'hard_deleted' | 'cancelled';
  expedited: boolean;
  requestedAt: Date;
  softDeletedAt: Date | null;
  hardDeleteScheduledAt: Date;
  hardDeletedAt: Date | null;
  cancelledAt: Date | null;
}

interface UserRow {
  id: string;
  deletedAt: Date | null;
  isSuspended: boolean;
}

interface FreezeRow {
  id: string;
  threadId: string;
  expiresAt: Date;
}

interface ReportRow {
  reporterUserId: string;
  reportedUserId: string;
  threadId: string | null;
}

class FakePrisma {
  users = new Map<string, UserRow>();
  deletions = new Map<string, DeletionRow>();
  byUser = new Map<string, string>();
  freezes: FreezeRow[] = [];
  reports: ReportRow[] = [];
  sessions: { userId: string; revokedAt: Date | null }[] = [];

  user = {
    update: async ({ where, data }: { where: { id: string }; data: Partial<UserRow> }) => {
      const u = this.users.get(where.id);
      if (!u) throw new Error('user not found');
      Object.assign(u, data);
      return u;
    },
  };

  accountDeletionRequest = {
    findUnique: async ({ where }: { where: { userId: string } }) => {
      const id = this.byUser.get(where.userId);
      return id ? this.deletions.get(id) ?? null : null;
    },
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { userId: string };
      create: Omit<DeletionRow, 'id'>;
      update: Partial<DeletionRow>;
    }) => {
      const existingId = this.byUser.get(where.userId);
      if (existingId) {
        const row = this.deletions.get(existingId)!;
        Object.assign(row, update);
        return row;
      }
      const id = crypto.randomUUID();
      const row: DeletionRow = { id, ...create };
      this.deletions.set(id, row);
      this.byUser.set(row.userId, id);
      return row;
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<DeletionRow> }) => {
      const row = this.deletions.get(where.id);
      if (!row) throw new Error('deletion not found');
      Object.assign(row, data);
      return row;
    },
    findMany: async ({
      where,
    }: {
      where: { status: string; hardDeleteScheduledAt: { lte: Date } };
    }) => {
      const out: DeletionRow[] = [];
      for (const r of this.deletions.values()) {
        if (
          r.status === where.status &&
          r.hardDeleteScheduledAt <= where.hardDeleteScheduledAt.lte
        ) {
          out.push(r);
        }
      }
      return out;
    },
  };

  evidenceFreeze = {
    findMany: async ({
      where,
      select,
    }: {
      where: { expiresAt: { gt: Date } };
      select: { threadId: true };
    }) => {
      void select;
      return this.freezes
        .filter((f) => f.expiresAt > where.expiresAt.gt)
        .map((f) => ({ threadId: f.threadId }));
    },
  };

  report = {
    findMany: async ({
      where,
    }: {
      where: { OR: [{ reporterUserId: string }, { reportedUserId: string }]; threadId: { not: null } };
    }) => {
      const ids = where.OR.map((c) =>
        'reporterUserId' in c ? c.reporterUserId : c.reportedUserId,
      );
      return this.reports
        .filter(
          (r) =>
            r.threadId !== null &&
            (ids.includes(r.reporterUserId) || ids.includes(r.reportedUserId)),
        )
        .map((r) => ({ threadId: r.threadId }));
    },
  };

  session = {
    updateMany: async ({
      where,
      data,
    }: {
      where: { userId: string; revokedAt: null };
      data: { revokedAt: Date };
    }) => {
      let count = 0;
      for (const s of this.sessions) {
        if (s.userId === where.userId && s.revokedAt === null) {
          s.revokedAt = data.revokedAt;
          count++;
        }
      }
      return { count };
    },
  };

  // The service uses $transaction — emulate by awaiting each operation.
  async $transaction<T extends Promise<unknown>[]>(ops: T): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
    const out: unknown[] = [];
    for (const op of ops) out.push(await op);
    return out as { [K in keyof T]: Awaited<T[K]> };
  }
}

describe('AccountDeletionService', () => {
  let prisma: FakePrisma;
  let svc: AccountDeletionService;

  beforeEach(() => {
    prisma = new FakePrisma();
    prisma.users.set('u1', { id: 'u1', deletedAt: null, isSuspended: false });
    prisma.sessions.push({ userId: 'u1', revokedAt: null });
    // Cast — minimal Prisma surface area exercised by the service.
    svc = new AccountDeletionService(prisma as never);
  });

  it('soft-delete sets deletedAt + suspended + 30-day schedule', async () => {
    const before = Date.now();
    const out = await svc.requestDeletion('u1');
    expect(out.status).toBe('soft_deleted');
    expect(out.expedited).toBe(false);
    const u = prisma.users.get('u1')!;
    expect(u.deletedAt).not.toBeNull();
    expect(u.isSuspended).toBe(true);
    const sched = new Date(out.hardDeleteScheduledAt).getTime();
    expect(sched - before).toBeGreaterThanOrEqual(30 * 86_400_000 - 1_000);
    expect(sched - before).toBeLessThanOrEqual(30 * 86_400_000 + 5_000);
    expect(prisma.sessions[0]?.revokedAt).not.toBeNull();
  });

  it('expedited soft-delete schedules immediate hard-delete', async () => {
    const out = await svc.requestDeletion('u1', { expedited: true });
    expect(out.expedited).toBe(true);
    expect(new Date(out.hardDeleteScheduledAt).getTime()).toBeCloseTo(
      new Date(out.softDeletedAt!).getTime(),
      -3,
    );
  });

  it('soft-delete is idempotent for non-cancelled prior request', async () => {
    const a = await svc.requestDeletion('u1');
    const b = await svc.requestDeletion('u1');
    expect(b.id).toBe(a.id);
  });

  it('cancel flips status and clears deletedAt', async () => {
    await svc.requestDeletion('u1');
    expect(await svc.cancelDeletion('u1')).toBe(true);
    expect(prisma.users.get('u1')!.deletedAt).toBeNull();
    expect(prisma.users.get('u1')!.isSuspended).toBe(false);
  });

  it('hard-delete pass returns only due requests, with frozen thread preservation', async () => {
    // Past-due
    const req = await svc.requestDeletion('u1', { expedited: true });
    // Set a freeze + report tying u1 to a chat thread.
    prisma.freezes.push({
      id: 'f1',
      threadId: 't1',
      expiresAt: new Date(Date.now() + 86_400_000),
    });
    prisma.reports.push({ reporterUserId: 'u1', reportedUserId: 'x', threadId: 't1' });

    // Add another non-due user.
    prisma.users.set('u2', { id: 'u2', deletedAt: null, isSuspended: false });
    await svc.requestDeletion('u2'); // 30-day schedule, not yet due

    const directives = await svc.planHardDeletePass();
    expect(directives.map((d) => d.userId)).toEqual(['u1']);
    expect(directives[0]!.preservedThreadIds).toEqual(['t1']);

    await svc.markHardDeleted(req.id);
    const after = await svc.planHardDeletePass();
    expect(after).toHaveLength(0);
  });
});

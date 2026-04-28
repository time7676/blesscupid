/**
 * BLE-10 — Pastor / CEO records moderation actions from the T&S queue.
 * Covers: dismiss → status=dismissed; warn → status=resolved; suspend/ban
 * → resolved + User.isSuspended=true; double-action rejected; missing
 * report → 404.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service.js';

interface ReportRow {
  id: string;
  reporterUserId: string;
  reportedUserId: string;
  status: 'open' | 'under_review' | 'resolved' | 'dismissed';
  resolvedAt: Date | null;
  resolvedByUserId: string | null;
  moderationActionId: string | null;
}

interface ActionRow {
  id: string;
  reportId: string;
  actorUserId: string;
  kind: string;
  notes: string | null;
  appliedAt: Date;
}

interface UserRow {
  id: string;
  isSuspended: boolean;
}

class FakePrisma {
  reportsByPk = new Map<string, ReportRow>();
  actions: ActionRow[] = [];
  users = new Map<string, UserRow>();

  report = {
    findUnique: async ({ where }: { where: { id: string } }) =>
      this.reportsByPk.get(where.id) ?? null,
    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<ReportRow>;
    }) => {
      const r = this.reportsByPk.get(where.id);
      if (!r) throw new Error('report not found');
      Object.assign(r, data);
      return r;
    },
  };

  moderationAction = {
    create: async ({ data }: { data: Omit<ActionRow, 'id'> }) => {
      const row: ActionRow = { id: crypto.randomUUID(), ...data };
      this.actions.push(row);
      return row;
    },
  };

  user = {
    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<UserRow>;
    }) => {
      const u = this.users.get(where.id);
      if (!u) throw new Error('user not found');
      Object.assign(u, data);
      return u;
    },
  };

  async $transaction<T extends Promise<unknown>[]>(
    ops: T,
  ): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
    const out: unknown[] = [];
    for (const op of ops) out.push(await op);
    return out as { [K in keyof T]: Awaited<T[K]> };
  }
}

const PASTOR = 'p1';
const REPORTED = 'u1';
const REPORT = 'r1';

function setup() {
  const prisma = new FakePrisma();
  prisma.reportsByPk.set(REPORT, {
    id: REPORT,
    reporterUserId: 'reporter1',
    reportedUserId: REPORTED,
    status: 'open',
    resolvedAt: null,
    resolvedByUserId: null,
    moderationActionId: null,
  });
  prisma.users.set(REPORTED, { id: REPORTED, isSuspended: false });
  // moderationStore unused for this method; pass an empty stub.
  const store = {} as never;
  const svc = new ReportsService(prisma as never, store);
  return { prisma, svc };
}

describe('ReportsService.applyModerationAction', () => {
  let prisma: FakePrisma;
  let svc: ReportsService;

  beforeEach(() => {
    ({ prisma, svc } = setup());
  });

  it('dismiss closes the report as dismissed and does NOT suspend', async () => {
    const out = await svc.applyModerationAction({
      reportId: REPORT,
      actorUserId: PASTOR,
      kind: 'dismiss',
    });
    expect(out.report.status).toBe('dismissed');
    expect(prisma.reportsByPk.get(REPORT)!.status).toBe('dismissed');
    expect(prisma.users.get(REPORTED)!.isSuspended).toBe(false);
    expect(prisma.actions[0]!.kind).toBe('dismiss');
  });

  it('warn closes as resolved without suspension', async () => {
    const out = await svc.applyModerationAction({
      reportId: REPORT,
      actorUserId: PASTOR,
      kind: 'warn',
      notes: 'first offense',
    });
    expect(out.report.status).toBe('resolved');
    expect(prisma.users.get(REPORTED)!.isSuspended).toBe(false);
    expect(prisma.actions[0]!.notes).toBe('first offense');
  });

  it('suspend closes as resolved AND suspends the reported user', async () => {
    await svc.applyModerationAction({
      reportId: REPORT,
      actorUserId: PASTOR,
      kind: 'suspend',
    });
    expect(prisma.users.get(REPORTED)!.isSuspended).toBe(true);
  });

  it('ban closes as resolved AND suspends', async () => {
    await svc.applyModerationAction({
      reportId: REPORT,
      actorUserId: PASTOR,
      kind: 'ban',
    });
    expect(prisma.users.get(REPORTED)!.isSuspended).toBe(true);
  });

  it('rejects re-action on an already-closed report', async () => {
    await svc.applyModerationAction({
      reportId: REPORT,
      actorUserId: PASTOR,
      kind: 'warn',
    });
    await expect(
      svc.applyModerationAction({
        reportId: REPORT,
        actorUserId: PASTOR,
        kind: 'ban',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws NotFoundException when report does not exist', async () => {
    await expect(
      svc.applyModerationAction({
        reportId: 'nope',
        actorUserId: PASTOR,
        kind: 'dismiss',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('persists the moderationActionId back on the report', async () => {
    const out = await svc.applyModerationAction({
      reportId: REPORT,
      actorUserId: PASTOR,
      kind: 'warn',
    });
    expect(out.report.moderationActionId).toBe(out.action.id);
    expect(prisma.reportsByPk.get(REPORT)!.moderationActionId).toBe(out.action.id);
  });
});

/**
 * BLE-63 — E2E coverage for the playbook A.4 routing rule.
 *
 * Asserts:
 *   - report.reason='harassment' → category='abuse' → queue='ceo_p0'.
 *   - abuse does NOT auto-lock (autoLockApplied=false, isSuspended unchanged).
 *   - report.reason='underage' → category='minor' → queue='ceo_p0' WITH
 *     immediate auto-lock (isSuspended=true).
 *   - non-CEO/non-Pastor reads against a ceo_p0 row deny via canAccessQueue.
 *
 * Pure unit-style with a fake Prisma — same pattern as
 * reports/moderation-action.test.ts. No DB needed.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { ReportsService } from './reports.service.js';
import { canAccessQueue } from '../moderation-actions/queue-acl.js';

interface ReportRow {
  id: string;
  reporterUserId: string;
  reportedUserId: string;
  reason: string;
  threadId: string | null;
  messageId: string | null;
  freeform: string | null;
  severity: number;
  status: string;
  category: string;
  queue: string;
  autoLockApplied: boolean;
  createdAt: Date;
}

interface UserRow {
  id: string;
  isSuspended: boolean;
}

class FakeStore {
  reports: Map<string, ReportRow>;
  constructor(reports: Map<string, ReportRow>) {
    this.reports = reports;
  }
  async recordReport(r: {
    id: string;
    reporterUserId: string;
    reportedUserId: string;
    reason: string;
    threadId?: string;
    messageId?: string;
    freeform?: string;
    createdAt: string;
  }) {
    this.reports.set(r.id, {
      id: r.id,
      reporterUserId: r.reporterUserId,
      reportedUserId: r.reportedUserId,
      reason: r.reason,
      threadId: r.threadId ?? null,
      messageId: r.messageId ?? null,
      freeform: r.freeform ?? null,
      severity: 0,
      status: 'open',
      category: 'other',
      queue: 'mod_triage',
      autoLockApplied: false,
      createdAt: new Date(r.createdAt),
    });
  }
}

class FakePrisma {
  reports = new Map<string, ReportRow>();
  users = new Map<string, UserRow>();
  freezes: { reportId: string; threadId: string; expiresAt: Date }[] = [];

  report = {
    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<ReportRow>;
    }) => {
      const r = this.reports.get(where.id);
      if (!r) throw new Error('report not found');
      Object.assign(r, data);
      return r;
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

  evidenceFreeze = {
    create: async ({
      data,
    }: {
      data: { reportId: string; threadId: string; expiresAt: Date };
    }) => {
      this.freezes.push(data);
      return data;
    },
  };
}

const REPORTER = 'reporter-1';
const REPORTED = 'reported-1';

function setup() {
  const prisma = new FakePrisma();
  prisma.users.set(REPORTED, { id: REPORTED, isSuspended: false });
  const store = new FakeStore(prisma.reports);
  const svc = new ReportsService(prisma as never, store as never);
  return { prisma, svc };
}

describe('BLE-63 routing — abuse/minor → ceo_p0 (Playbook A.4)', () => {
  let prisma: FakePrisma;
  let svc: ReportsService;

  beforeEach(() => {
    ({ prisma, svc } = setup());
  });

  it('harassment → abuse → ceo_p0 queue, NO auto-lock', async () => {
    const out = await svc.create(REPORTER, {
      reportedUserId: REPORTED,
      reason: 'harassment',
    });
    expect(out.category).toBe('abuse');
    expect(out.queue).toBe('ceo_p0');
    expect(out.autoLockApplied).toBe(false);
    expect(prisma.users.get(REPORTED)!.isSuspended).toBe(false);

    const row = prisma.reports.get(out.id)!;
    expect(row.queue).toBe('ceo_p0');
    expect(row.category).toBe('abuse');
    expect(row.autoLockApplied).toBe(false);
  });

  it('underage → minor → ceo_p0 with immediate auto-lock', async () => {
    const out = await svc.create(REPORTER, {
      reportedUserId: REPORTED,
      reason: 'underage',
    });
    expect(out.category).toBe('minor');
    expect(out.queue).toBe('ceo_p0');
    expect(out.autoLockApplied).toBe(true);
    expect(prisma.users.get(REPORTED)!.isSuspended).toBe(true);

    const row = prisma.reports.get(out.id)!;
    expect(row.autoLockApplied).toBe(true);
  });

  it('sexual_content → other → mod_triage (NOT ceo_p0)', async () => {
    const out = await svc.create(REPORTER, {
      reportedUserId: REPORTED,
      reason: 'sexual_content',
    });
    expect(out.category).toBe('other');
    expect(out.queue).toBe('mod_triage');
    expect(out.autoLockApplied).toBe(false);
    expect(prisma.users.get(REPORTED)!.isSuspended).toBe(false);
  });

  it('ceo_p0 row: only CEO + Pastor can read; member denied', () => {
    expect(canAccessQueue('ceo', 'ceo_p0')).toBe('allow');
    expect(canAccessQueue('pastor', 'ceo_p0')).toBe('allow');
    expect(canAccessQueue('member', 'ceo_p0')).toBe('deny');
  });

  it('cannot report self', async () => {
    await expect(
      svc.create(REPORTER, { reportedUserId: REPORTER, reason: 'harassment' }),
    ).rejects.toThrow();
  });
});

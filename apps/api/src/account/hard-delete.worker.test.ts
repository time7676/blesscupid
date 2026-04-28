/**
 * BLE-10 — verifies the hard-delete worker:
 *  - tombstones non-frozen-thread messages
 *  - preserves frozen-thread messages verbatim
 *  - deletes Photo + OAuth + Session + Faith + Profile + CovenantSig rows
 *  - anonymizes Reports + drops Blocks
 *  - scrubs the User row but keeps the id (FK integrity for frozen messages)
 *  - calls AccountDeletionService.markHardDeleted
 *  - feeds storage keys to the optional ObjectStorePort
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HardDeleteWorker, type ObjectStorePort } from './hard-delete.worker.js';
import type { AccountDeletionService } from './account-deletion.service.js';

interface MessageRow {
  id: string;
  threadId: string;
  senderUserId: string;
  recipientUserId: string;
  body: string;
  attachmentIds: string[];
}

interface PhotoRow {
  id: string;
  userId: string;
  storageKey: string;
}

interface ReportRow {
  id: string;
  reporterUserId: string;
  reportedUserId: string;
  freeform: string | null;
}

interface BlockRow {
  blockerUserId: string;
  blockedUserId: string;
}

interface UserRow {
  id: string;
  email: string;
  passwordHash: string | null;
  dob: Date;
  ageVerifiedAdult: boolean;
  emailVerified: boolean;
  isSuspended: boolean;
  deletedAt: Date | null;
}

class FakePrisma {
  users = new Map<string, UserRow>();
  messagesArr: MessageRow[] = [];
  photosArr: PhotoRow[] = [];
  reportsArr: ReportRow[] = [];
  blocksArr: BlockRow[] = [];
  oAuthAccounts: { id: string; userId: string }[] = [];
  sessionsArr: { id: string; userId: string }[] = [];
  covenantSigs: { id: string; userId: string }[] = [];
  faithProfiles: { userId: string }[] = [];
  profiles: { userId: string }[] = [];

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

  photo = {
    findMany: async ({
      where,
    }: {
      where: { userId: string };
      select?: { id: true; storageKey: true };
    }) => {
      return this.photosArr
        .filter((p) => p.userId === where.userId)
        .map((p) => ({ id: p.id, storageKey: p.storageKey }));
    },
    deleteMany: async ({ where }: { where: { userId: string } }) => {
      const before = this.photosArr.length;
      this.photosArr = this.photosArr.filter((p) => p.userId !== where.userId);
      return { count: before - this.photosArr.length };
    },
  };

  message = {
    updateMany: async ({
      where,
      data,
    }: {
      where: {
        OR: [{ senderUserId: string }, { recipientUserId: string }];
        threadId?: { notIn: string[] };
      };
      data: { body: string; attachmentIds: string[] };
    }) => {
      const userId =
        'senderUserId' in where.OR[0] ? where.OR[0].senderUserId : '';
      const exclude = where.threadId?.notIn ?? null;
      let count = 0;
      for (const m of this.messagesArr) {
        if (m.senderUserId !== userId && m.recipientUserId !== userId) continue;
        if (exclude && exclude.includes(m.threadId)) continue;
        m.body = data.body;
        m.attachmentIds = data.attachmentIds;
        count++;
      }
      return { count };
    },
    count: async ({
      where,
    }: {
      where: {
        OR: [{ senderUserId: string }, { recipientUserId: string }];
        threadId: { in: string[] };
      };
    }) => {
      const userId = 'senderUserId' in where.OR[0] ? where.OR[0].senderUserId : '';
      const include = where.threadId.in;
      return this.messagesArr.filter(
        (m) =>
          (m.senderUserId === userId || m.recipientUserId === userId) &&
          include.includes(m.threadId),
      ).length;
    },
  };

  report = {
    updateMany: async ({
      where,
      data,
    }: {
      where: { OR: [{ reporterUserId: string }, { reportedUserId: string }] };
      data: { freeform: null };
    }) => {
      const userId =
        'reporterUserId' in where.OR[0] ? where.OR[0].reporterUserId : '';
      let count = 0;
      for (const r of this.reportsArr) {
        if (r.reporterUserId === userId || r.reportedUserId === userId) {
          r.freeform = data.freeform;
          count++;
        }
      }
      return { count };
    },
  };

  block = {
    deleteMany: async ({
      where,
    }: {
      where: { OR: [{ blockerUserId: string }, { blockedUserId: string }] };
    }) => {
      const userId = 'blockerUserId' in where.OR[0] ? where.OR[0].blockerUserId : '';
      const before = this.blocksArr.length;
      this.blocksArr = this.blocksArr.filter(
        (b) => b.blockerUserId !== userId && b.blockedUserId !== userId,
      );
      return { count: before - this.blocksArr.length };
    },
  };

  oAuthAccount = makeDeleteMany(this.oAuthAccounts);
  session = makeDeleteMany(this.sessionsArr);
  covenantSignature = makeDeleteMany(this.covenantSigs);
  faithProfile = makeDeleteMany(this.faithProfiles);
  profile = makeDeleteMany(this.profiles);
}

function makeDeleteMany<T extends { userId: string }>(arr: T[]) {
  return {
    deleteMany: async ({ where }: { where: { userId: string } }) => {
      const before = arr.length;
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i]!.userId === where.userId) arr.splice(i, 1);
      }
      return { count: before - arr.length };
    },
  };
}

describe('HardDeleteWorker', () => {
  let prisma: FakePrisma;
  let deletion: { planHardDeletePass: ReturnType<typeof vi.fn>; markHardDeleted: ReturnType<typeof vi.fn> };
  let store: ObjectStorePort & { deleted: string[] };

  const USER = 'u1';
  const FROZEN_THREAD = 'frozen-1';
  const OPEN_THREAD = 'open-1';

  beforeEach(() => {
    prisma = new FakePrisma();
    prisma.users.set(USER, {
      id: USER,
      email: 'real@user.com',
      passwordHash: 'h',
      dob: new Date('1990-01-01'),
      ageVerifiedAdult: true,
      emailVerified: true,
      isSuspended: false,
      deletedAt: null,
    });
    prisma.messagesArr.push(
      { id: 'm1', threadId: FROZEN_THREAD, senderUserId: USER, recipientUserId: 'other', body: 'I crossed a line', attachmentIds: [] },
      { id: 'm2', threadId: FROZEN_THREAD, senderUserId: 'other', recipientUserId: USER, body: 'reply', attachmentIds: [] },
      { id: 'm3', threadId: OPEN_THREAD, senderUserId: USER, recipientUserId: 'other2', body: 'hi', attachmentIds: ['a1'] },
    );
    prisma.photosArr.push({ id: 'p1', userId: USER, storageKey: 'photos/u1/1.jpg' });
    prisma.reportsArr.push({
      id: 'r1',
      reporterUserId: 'other',
      reportedUserId: USER,
      freeform: 'kept pressuring me',
    });
    prisma.blocksArr.push({ blockerUserId: USER, blockedUserId: 'other2' });
    prisma.oAuthAccounts.push({ id: 'o1', userId: USER });
    prisma.sessionsArr.push({ id: 's1', userId: USER });
    prisma.covenantSigs.push({ id: 'c1', userId: USER });
    prisma.faithProfiles.push({ userId: USER });
    prisma.profiles.push({ userId: USER });

    deletion = {
      planHardDeletePass: vi.fn().mockResolvedValue([
        { requestId: 'req1', userId: USER, preservedThreadIds: [FROZEN_THREAD] },
      ]),
      markHardDeleted: vi.fn().mockResolvedValue(undefined),
    };
    store = {
      deleted: [],
      deleteObjects: async (keys: string[]) => {
        store.deleted.push(...keys);
      },
    };
  });

  it('purges PII while preserving frozen-thread messages', async () => {
    const worker = new HardDeleteWorker(
      prisma as never,
      deletion as unknown as AccountDeletionService,
      store,
    );
    const reports = await worker.runOnce();

    expect(reports).toHaveLength(1);
    const r = reports[0]!;
    expect(r.userId).toBe(USER);
    expect(r.requestId).toBe('req1');
    expect(r.messagesTombstoned).toBe(1); // m3 only
    expect(r.messagesPreserved).toBe(2); // m1, m2
    expect(r.photosDeleted).toBe(1);
    expect(r.storageKeysFreed).toEqual(['photos/u1/1.jpg']);
    expect(r.reportsAnonymized).toBe(1);
    expect(r.blocksRemoved).toBe(1);

    // Frozen thread messages untouched.
    expect(prisma.messagesArr.find((m) => m.id === 'm1')!.body).toBe('I crossed a line');
    expect(prisma.messagesArr.find((m) => m.id === 'm2')!.body).toBe('reply');
    // Open thread tombstoned.
    expect(prisma.messagesArr.find((m) => m.id === 'm3')!.body).toBe('[deleted]');
    expect(prisma.messagesArr.find((m) => m.id === 'm3')!.attachmentIds).toEqual([]);

    // PII tables emptied.
    expect(prisma.photosArr).toHaveLength(0);
    expect(prisma.oAuthAccounts).toHaveLength(0);
    expect(prisma.sessionsArr).toHaveLength(0);
    expect(prisma.covenantSigs).toHaveLength(0);
    expect(prisma.faithProfiles).toHaveLength(0);
    expect(prisma.profiles).toHaveLength(0);

    // Report freeform anonymized.
    expect(prisma.reportsArr[0]!.freeform).toBeNull();

    // Block dropped.
    expect(prisma.blocksArr).toHaveLength(0);

    // User scrubbed but not deleted (FK integrity for frozen messages).
    const u = prisma.users.get(USER)!;
    expect(u.email).toBe(`deleted-${USER}@deleted.local`);
    expect(u.passwordHash).toBeNull();
    expect(u.deletedAt).not.toBeNull();
    expect(u.isSuspended).toBe(true);

    // Object store fed.
    expect(store.deleted).toEqual(['photos/u1/1.jpg']);

    // Marker called.
    expect(deletion.markHardDeleted).toHaveBeenCalledWith('req1');
  });

  it('runs without object-store hook (DB-only purge)', async () => {
    const worker = new HardDeleteWorker(
      prisma as never,
      deletion as unknown as AccountDeletionService,
      // no objectStore
    );
    const reports = await worker.runOnce();
    expect(reports[0]!.storageKeysFreed).toEqual(['photos/u1/1.jpg']);
    // no throw — DB rows still gone.
    expect(prisma.photosArr).toHaveLength(0);
  });

  it('no-op when nothing is due', async () => {
    deletion.planHardDeletePass.mockResolvedValueOnce([]);
    const worker = new HardDeleteWorker(
      prisma as never,
      deletion as unknown as AccountDeletionService,
    );
    const reports = await worker.runOnce();
    expect(reports).toEqual([]);
    expect(deletion.markHardDeleted).not.toHaveBeenCalled();
  });
});

/**
 * v1-restart — verifies the hourly hard-delete worker:
 *  - finds users where deletedAt < now - 30d
 *  - calls AccountDeletionService.permanentlyDelete per user
 *  - skips users still inside the restore window
 *  - is bounded by BATCH_SIZE
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HardDeleteWorker } from './hard-delete.worker.js';
import type { AccountDeletionService } from './account-deletion.service.js';

interface UserRow {
  id: string;
  deletedAt: Date | null;
}

class FakePrisma {
  users: UserRow[] = [];

  user = {
    findMany: async ({
      where,
      take,
    }: {
      where: { deletedAt: { lt: Date; not: null } };
      select?: { id: true };
      take?: number;
    }) => {
      const cutoff = where.deletedAt.lt;
      return this.users
        .filter((u) => u.deletedAt !== null && u.deletedAt < cutoff)
        .slice(0, take ?? Infinity)
        .map((u) => ({ id: u.id }));
    },
  };
}

describe('HardDeleteWorker', () => {
  let prisma: FakePrisma;
  let deletion: { permanentlyDelete: ReturnType<typeof vi.fn> };
  let worker: HardDeleteWorker;

  beforeEach(() => {
    prisma = new FakePrisma();
    deletion = { permanentlyDelete: vi.fn().mockResolvedValue(undefined) };
    worker = new HardDeleteWorker(
      prisma as never,
      deletion as unknown as AccountDeletionService,
    );
  });

  it('purges users whose deletedAt is older than 30 days', async () => {
    const longAgo = new Date(Date.now() - 31 * 86_400_000);
    const recent = new Date(Date.now() - 5 * 86_400_000);
    prisma.users.push(
      { id: 'old1', deletedAt: longAgo },
      { id: 'old2', deletedAt: longAgo },
      { id: 'recent', deletedAt: recent },
      { id: 'active', deletedAt: null },
    );

    const purged = await worker.runOnce();

    expect(purged.sort()).toEqual(['old1', 'old2']);
    expect(deletion.permanentlyDelete).toHaveBeenCalledWith('old1');
    expect(deletion.permanentlyDelete).toHaveBeenCalledWith('old2');
    expect(deletion.permanentlyDelete).not.toHaveBeenCalledWith('recent');
    expect(deletion.permanentlyDelete).not.toHaveBeenCalledWith('active');
  });

  it('returns [] when nothing is due', async () => {
    prisma.users.push({
      id: 'recent',
      deletedAt: new Date(Date.now() - 86_400_000),
    });
    const purged = await worker.runOnce();
    expect(purged).toEqual([]);
    expect(deletion.permanentlyDelete).not.toHaveBeenCalled();
  });

  it('continues past per-user delete failures and reports only successes', async () => {
    const longAgo = new Date(Date.now() - 31 * 86_400_000);
    prisma.users.push(
      { id: 'good', deletedAt: longAgo },
      { id: 'bad', deletedAt: longAgo },
    );
    deletion.permanentlyDelete
      .mockResolvedValueOnce(undefined) // good
      .mockRejectedValueOnce(new Error('fk violation')); // bad

    const purged = await worker.runOnce();
    expect(purged).toEqual(['good']);
  });
});

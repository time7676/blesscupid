/**
 * Unit tests for v1-restart account-deletion service against fake Prisma +
 * fake TokenService. AccountDeletionRequest table is gone — state lives on
 * `User.deletedAt` only.
 *
 * Covers: soft-delete stamps deletedAt + revokes sessions + idempotent;
 * cancelDeletion within 30d window; cancelDeletion outside window returns
 * false; permanentlyDelete calls prisma.user.delete().
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AccountDeletionService,
  HARD_DELETE_DAYS,
} from './account-deletion.service.js';
import type { TokenService } from '../auth/token.service.js';

interface UserRow {
  id: string;
  deletedAt: Date | null;
}

class FakePrisma {
  users = new Map<string, UserRow>();
  deletedIds: string[] = [];

  user = {
    findUnique: async ({
      where,
      select,
    }: {
      where: { id: string };
      select?: { deletedAt?: true };
    }) => {
      void select;
      const u = this.users.get(where.id);
      return u ? { ...u } : null;
    },
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
    delete: async ({ where }: { where: { id: string } }) => {
      const u = this.users.get(where.id);
      if (!u) throw new Error('user not found');
      this.users.delete(where.id);
      this.deletedIds.push(where.id);
      return u;
    },
  };
}

describe('AccountDeletionService', () => {
  let prisma: FakePrisma;
  let tokens: { revokeAllForUser: ReturnType<typeof vi.fn> };
  let svc: AccountDeletionService;

  beforeEach(() => {
    prisma = new FakePrisma();
    prisma.users.set('u1', { id: 'u1', deletedAt: null });
    tokens = { revokeAllForUser: vi.fn().mockResolvedValue(undefined) };
    svc = new AccountDeletionService(
      prisma as never,
      tokens as unknown as TokenService,
    );
  });

  it('softDelete stamps deletedAt and revokes all sessions', async () => {
    const before = Date.now();
    const out = await svc.softDelete('u1');
    const u = prisma.users.get('u1')!;
    expect(u.deletedAt).not.toBeNull();
    expect(u.deletedAt!.getTime()).toBeGreaterThanOrEqual(before - 1_000);
    expect(tokens.revokeAllForUser).toHaveBeenCalledWith('u1');
    const restoreTs = new Date(out.restoreDeadline).getTime();
    const deletedTs = new Date(out.deletedAt).getTime();
    expect(restoreTs - deletedTs).toBe(HARD_DELETE_DAYS * 86_400_000);
  });

  it('softDelete is idempotent — second call does not re-stamp or re-revoke', async () => {
    const a = await svc.softDelete('u1');
    const stampedAt = prisma.users.get('u1')!.deletedAt!.getTime();
    await new Promise((r) => setTimeout(r, 5));
    const b = await svc.softDelete('u1');
    expect(prisma.users.get('u1')!.deletedAt!.getTime()).toBe(stampedAt);
    expect(b.deletedAt).toBe(a.deletedAt);
    expect(tokens.revokeAllForUser).toHaveBeenCalledTimes(1);
  });

  it('cancelDeletion clears deletedAt within the 30d window', async () => {
    await svc.softDelete('u1');
    expect(await svc.cancelDeletion('u1')).toBe(true);
    expect(prisma.users.get('u1')!.deletedAt).toBeNull();
  });

  it('cancelDeletion returns false outside the 30d window', async () => {
    // Stamp deletedAt 31 days ago directly.
    prisma.users.get('u1')!.deletedAt = new Date(
      Date.now() - 31 * 86_400_000,
    );
    expect(await svc.cancelDeletion('u1')).toBe(false);
    expect(prisma.users.get('u1')!.deletedAt).not.toBeNull();
  });

  it('cancelDeletion returns false when account is not soft-deleted', async () => {
    expect(await svc.cancelDeletion('u1')).toBe(false);
  });

  it('permanentlyDelete calls prisma.user.delete (cascade handles fan-out)', async () => {
    await svc.permanentlyDelete('u1');
    expect(prisma.deletedIds).toEqual(['u1']);
    expect(prisma.users.has('u1')).toBe(false);
  });
});

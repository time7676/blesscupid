import { describe, expect, it } from 'vitest';
import { fixedClock } from '../src/clock.js';
import { counterIdGen } from '../src/id.js';
import { InMemorySafetyRepository } from '../src/in-memory-repo.js';
import {
  cancelAccountDeletion,
  markHardDeleted,
  planHardDeletePass,
  requestAccountDeletion,
} from '../src/deletion.js';

function deps() {
  return {
    repo: new InMemorySafetyRepository(),
    clock: fixedClock(new Date('2026-04-28T10:00:00Z')),
    ids: counterIdGen('del'),
  };
}

describe('account deletion', () => {
  it('soft-deletes immediately and schedules hard delete +30 days', async () => {
    const d = deps();
    const req = await requestAccountDeletion(d, 'user-1');
    expect(req.status).toBe('soft_deleted');
    expect(req.softDeletedAt).toBe('2026-04-28T10:00:00.000Z');
    expect(req.hardDeleteScheduledAt).toBe('2026-05-28T10:00:00.000Z');
  });

  it('expedited deletion schedules hard delete immediately', async () => {
    const d = deps();
    const req = await requestAccountDeletion(d, 'user-1', { expedited: true });
    expect(req.hardDeleteScheduledAt).toBe(req.softDeletedAt);
  });

  it('does not appear in hard-delete pass before the scheduled date', async () => {
    const d = deps();
    await requestAccountDeletion(d, 'user-1');
    d.clock.advance(29 * 86_400_000);
    const directives = await planHardDeletePass(d, async () => []);
    expect(directives).toHaveLength(0);
  });

  it('appears in hard-delete pass on/after the scheduled date with frozen-thread directives', async () => {
    const d = deps();
    await requestAccountDeletion(d, 'user-1');
    d.clock.advance(31 * 86_400_000);
    const directives = await planHardDeletePass(d, async (uid) => {
      expect(uid).toBe('user-1');
      return ['thread-frozen-1'];
    });
    expect(directives).toHaveLength(1);
    expect(directives[0]?.preservedChatThreadIds).toEqual(['thread-frozen-1']);

    await markHardDeleted(d, directives[0]!.request.id);
    const after = await planHardDeletePass(d, async () => []);
    expect(after).toHaveLength(0);
  });

  it('cancel within window flips status, cancel after hard-delete fails', async () => {
    const d = deps();
    await requestAccountDeletion(d, 'user-1');
    expect(await cancelAccountDeletion(d, 'user-1')).toBe(true);

    // After cancel, a new request can be made.
    await requestAccountDeletion(d, 'user-1');
    d.clock.advance(31 * 86_400_000);
    const dir = await planHardDeletePass(d, async () => []);
    await markHardDeleted(d, dir[0]!.request.id);
    expect(await cancelAccountDeletion(d, 'user-1')).toBe(false);
  });
});

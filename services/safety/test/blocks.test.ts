import { describe, expect, it } from 'vitest';
import { fixedClock } from '../src/clock.js';
import { InMemorySafetyRepository } from '../src/in-memory-repo.js';
import {
  createBlock,
  isBlocked,
  listBlockedUserIdsFor,
  removeBlock,
} from '../src/blocks.js';

const ALICE = 'a';
const BOB = 'b';
const CARL = 'c';

function deps() {
  return {
    repo: new InMemorySafetyRepository(),
    clock: fixedClock(new Date('2026-04-28T10:00:00Z')),
  };
}

describe('blocks', () => {
  it('is bidirectional: either side sees the block', async () => {
    const d = deps();
    await createBlock(d, ALICE, BOB);
    expect(await isBlocked(d, ALICE, BOB)).toBe(true);
    expect(await isBlocked(d, BOB, ALICE)).toBe(true);
  });

  it('is idempotent: re-blocking does not create a duplicate', async () => {
    const d = deps();
    await createBlock(d, ALICE, BOB);
    await createBlock(d, ALICE, BOB);
    const blocks = await d.repo.listBlocksForUser(ALICE);
    expect(blocks).toHaveLength(1);
  });

  it('rejects self-blocks', async () => {
    const d = deps();
    await expect(createBlock(d, ALICE, ALICE)).rejects.toThrow(/self/);
  });

  it('listBlockedUserIdsFor returns the other party regardless of order', async () => {
    const d = deps();
    await createBlock(d, BOB, ALICE);
    await createBlock(d, ALICE, CARL);
    const fromAlice = await listBlockedUserIdsFor(d, ALICE);
    expect(new Set(fromAlice)).toEqual(new Set([BOB, CARL]));
  });

  it('removeBlock symmetric: either party can unblock', async () => {
    const d = deps();
    await createBlock(d, ALICE, BOB);
    expect(await removeBlock(d, BOB, ALICE)).toBe(true);
    expect(await isBlocked(d, ALICE, BOB)).toBe(false);
  });
});

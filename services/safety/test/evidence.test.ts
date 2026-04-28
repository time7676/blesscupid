import { describe, expect, it } from 'vitest';
import { fixedClock } from '../src/clock.js';
import { counterIdGen } from '../src/id.js';
import { InMemorySafetyRepository } from '../src/in-memory-repo.js';
import { createReport } from '../src/reports.js';
import { expireOldFreezes, isThreadFrozen } from '../src/evidence.js';

const REPORTER = '11111111-1111-1111-1111-111111111111';
const REPORTED = '22222222-2222-2222-2222-222222222222';
const THREAD = '33333333-3333-3333-3333-333333333333';

function deps() {
  return {
    repo: new InMemorySafetyRepository(),
    clock: fixedClock(new Date('2026-04-28T10:00:00Z')),
    ids: counterIdGen('rpt'),
  };
}

describe('evidence freeze lifecycle', () => {
  it('freeze is active for 90 days then expires on cleanup pass', async () => {
    const d = deps();
    await createReport(
      d,
      { reporterUserId: REPORTER },
      {
        reportedUserId: REPORTED,
        chatThreadId: THREAD,
        reason: 'harassment',
      },
    );
    expect(await isThreadFrozen(d, THREAD)).toBe(true);

    d.clock.advance(89 * 86_400_000);
    expect(await isThreadFrozen(d, THREAD)).toBe(true);
    const stillActive = await expireOldFreezes(d);
    expect(stillActive.expired).toBe(0);

    d.clock.advance(2 * 86_400_000); // total 91 days
    expect(await isThreadFrozen(d, THREAD)).toBe(false);
    const cleaned = await expireOldFreezes(d);
    expect(cleaned.expired).toBe(1);
  });
});

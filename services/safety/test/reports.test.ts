import { describe, expect, it } from 'vitest';
import { fixedClock } from '../src/clock.js';
import { counterIdGen } from '../src/id.js';
import { InMemorySafetyRepository } from '../src/in-memory-repo.js';
import { createReport } from '../src/reports.js';
import { isThreadFrozen } from '../src/evidence.js';

const REPORTER = '11111111-1111-1111-1111-111111111111';
const REPORTED = '22222222-2222-2222-2222-222222222222';
const THREAD = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

function deps() {
  const clock = fixedClock(new Date('2026-04-28T10:00:00Z'));
  const ids = counterIdGen('rpt');
  const repo = new InMemorySafetyRepository();
  return { clock, ids, repo };
}

describe('createReport', () => {
  it('persists a report and freezes the chat thread for 90 days', async () => {
    const d = deps();
    const result = await createReport(
      { repo: d.repo, clock: d.clock, ids: d.ids },
      { reporterUserId: REPORTER },
      {
        reportedUserId: REPORTED,
        chatThreadId: THREAD,
        reason: 'harassment',
        freeText: 'kept sending pressure messages',
      },
    );

    expect(result.report.status).toBe('open');
    expect(result.report.reason).toBe('harassment');
    expect(result.evidenceFreeze).not.toBeNull();
    expect(result.evidenceFreeze?.chatThreadId).toBe(THREAD);
    expect(result.evidenceFreeze?.expiresAt).toBe('2026-07-27T10:00:00.000Z');

    const frozen = await isThreadFrozen({ repo: d.repo, clock: d.clock }, THREAD);
    expect(frozen).toBe(true);
  });

  it('rejects self-reports', async () => {
    const d = deps();
    await expect(
      createReport(
        { repo: d.repo, clock: d.clock, ids: d.ids },
        { reporterUserId: REPORTER },
        { reportedUserId: REPORTER, reason: 'harassment' },
      ),
    ).rejects.toThrow(/self/);
  });

  it('does not create a freeze when no chat thread is involved', async () => {
    const d = deps();
    const result = await createReport(
      { repo: d.repo, clock: d.clock, ids: d.ids },
      { reporterUserId: REPORTER },
      { reportedUserId: REPORTED, reason: 'impersonation' },
    );
    expect(result.evidenceFreeze).toBeNull();
  });

  it('scores sexual_content reports more severely than other', async () => {
    const d1 = deps();
    const d2 = deps();
    const r1 = await createReport(
      { repo: d1.repo, clock: d1.clock, ids: d1.ids },
      { reporterUserId: REPORTER },
      { reportedUserId: REPORTED, reason: 'sexual_content' },
    );
    const r2 = await createReport(
      { repo: d2.repo, clock: d2.clock, ids: d2.ids },
      { reporterUserId: REPORTER },
      { reportedUserId: REPORTED, reason: 'other' },
    );
    expect(r1.report.severity).toBeGreaterThan(r2.report.severity);
  });

  it('rejects oversized free text via zod', async () => {
    const d = deps();
    await expect(
      createReport(
        { repo: d.repo, clock: d.clock, ids: d.ids },
        { reporterUserId: REPORTER },
        {
          reportedUserId: REPORTED,
          reason: 'harassment',
          freeText: 'x'.repeat(501),
        },
      ),
    ).rejects.toThrow();
  });
});

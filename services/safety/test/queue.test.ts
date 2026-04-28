import { describe, expect, it } from 'vitest';
import { fixedClock } from '../src/clock.js';
import { counterIdGen } from '../src/id.js';
import { InMemorySafetyRepository } from '../src/in-memory-repo.js';
import { createReport } from '../src/reports.js';
import { applyModerationAction, listTriageQueue } from '../src/queue.js';

const REPORTER_A = '11111111-1111-1111-1111-111111111111';
const REPORTER_B = '22222222-2222-2222-2222-222222222222';
const REPORTED = '33333333-3333-3333-3333-333333333333';
const PASTOR = '44444444-4444-4444-4444-444444444444';
const THREAD_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const THREAD_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

function deps() {
  return {
    repo: new InMemorySafetyRepository(),
    clock: fixedClock(new Date('2026-04-28T10:00:00Z')),
    ids: counterIdGen('q'),
  };
}

describe('triage queue', () => {
  it('orders by severity desc, then age asc', async () => {
    const d = deps();

    // Older, lower severity (other)
    await createReport(
      d,
      { reporterUserId: REPORTER_A },
      { reportedUserId: REPORTED, chatThreadId: THREAD_A, reason: 'other' },
    );

    d.clock.advance(60_000);

    // Newer, higher severity (sexual_content + classifier flagged)
    const high = await createReport(
      { ...d },
      { reporterUserId: REPORTER_B, classifierFlagged: true },
      { reportedUserId: REPORTED, chatThreadId: THREAD_B, reason: 'sexual_content' },
    );

    const queue = await listTriageQueue(d);
    expect(queue[0]?.id).toBe(high.report.id);
  });

  it('applyModerationAction resolves a report and records audit', async () => {
    const d = deps();
    const r = await createReport(
      d,
      { reporterUserId: REPORTER_A },
      { reportedUserId: REPORTED, chatThreadId: THREAD_A, reason: 'harassment' },
    );

    const out = await applyModerationAction(d, {
      reportId: r.report.id,
      actorUserId: PASTOR,
      kind: 'ban',
      notes: 'Repeated harassment after warn',
    });

    expect(out.action.kind).toBe('ban');
    expect(out.resolvedReport.status).toBe('resolved');
    expect(out.resolvedReport.moderationActionId).toBe(out.action.id);

    const queue = await listTriageQueue(d);
    expect(queue.find((q) => q.id === r.report.id)).toBeUndefined();
  });

  it('dismiss kind sets status to dismissed', async () => {
    const d = deps();
    const r = await createReport(
      d,
      { reporterUserId: REPORTER_A },
      { reportedUserId: REPORTED, reason: 'other' },
    );
    const out = await applyModerationAction(d, {
      reportId: r.report.id,
      actorUserId: PASTOR,
      kind: 'dismiss',
    });
    expect(out.resolvedReport.status).toBe('dismissed');
  });

  it('cannot apply action twice to a closed report', async () => {
    const d = deps();
    const r = await createReport(
      d,
      { reporterUserId: REPORTER_A },
      { reportedUserId: REPORTED, reason: 'harassment' },
    );
    await applyModerationAction(d, {
      reportId: r.report.id,
      actorUserId: PASTOR,
      kind: 'warn',
    });
    await expect(
      applyModerationAction(d, {
        reportId: r.report.id,
        actorUserId: PASTOR,
        kind: 'ban',
      }),
    ).rejects.toThrow(/already closed/);
  });
});

import type {
  ModerationAction,
  ModerationActionKind,
  Report,
} from '@blesscupid/shared';
import type { Clock } from './clock.js';
import type { IdGen } from './id.js';
import type { SafetyRepository } from './repository.js';

export interface QueueDeps {
  repo: SafetyRepository;
  clock: Clock;
  ids: IdGen;
}

/**
 * The T&S queue surface: ordered by severity desc, then age asc.
 * Pastor + CEO consume this. Resolved/dismissed reports are excluded.
 */
export async function listTriageQueue(deps: QueueDeps): Promise<Report[]> {
  const open = await deps.repo.listReports({ status: ['open', 'under_review'] });
  return open.slice().sort((a, b) => {
    if (a.severity !== b.severity) return b.severity - a.severity;
    return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
  });
}

export interface ApplyActionInput {
  reportId: string;
  actorUserId: string;
  kind: ModerationActionKind;
  notes?: string;
}

export interface ApplyActionResult {
  action: ModerationAction;
  resolvedReport: Report;
}

/**
 * Pastor/CEO records a decision. The report is resolved (or dismissed) and
 * the action persisted for audit. Returns the stored objects so the caller
 * can fan out user-state changes (suspend / ban) and notify the reporter.
 */
export async function applyModerationAction(
  deps: QueueDeps,
  input: ApplyActionInput,
): Promise<ApplyActionResult> {
  const report = await deps.repo.getReport(input.reportId);
  if (!report) {
    throw new Error(`report ${input.reportId} not found`);
  }
  if (report.status === 'resolved' || report.status === 'dismissed') {
    throw new Error(`report ${input.reportId} already closed (${report.status})`);
  }

  const now = deps.clock.now().toISOString();
  const action: ModerationAction = {
    id: deps.ids.next(),
    reportId: report.id,
    actorUserId: input.actorUserId,
    kind: input.kind,
    notes: input.notes ?? null,
    appliedAt: now,
  };
  await deps.repo.insertModerationAction(action);

  const newStatus = input.kind === 'dismiss' ? 'dismissed' : 'resolved';
  await deps.repo.updateReportStatus(
    report.id,
    newStatus,
    now,
    input.actorUserId,
    action.id,
  );

  return {
    action,
    resolvedReport: {
      ...report,
      status: newStatus,
      resolvedAt: now,
      resolvedByUserId: input.actorUserId,
      moderationActionId: action.id,
    },
  };
}

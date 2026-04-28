import {
  CreateReportInputSchema,
  EVIDENCE_FREEZE_DAYS,
  type CreateReportInput,
  type EvidenceFreeze,
  type Report,
} from '@blesscupid/shared';
import type { Clock } from './clock.js';
import type { IdGen } from './id.js';
import type { SafetyRepository } from './repository.js';
import { scoreSeverity } from './severity.js';

export interface CreateReportDeps {
  repo: SafetyRepository;
  clock: Clock;
  ids: IdGen;
}

export interface CreateReportContext {
  reporterUserId: string;
  classifierFlagged?: boolean;
  reportedUserPriorActions?: number;
}

export interface CreateReportResult {
  report: Report;
  evidenceFreeze: EvidenceFreeze | null;
}

/**
 * Persist a `Report` and, when a chat thread is involved, an `EvidenceFreeze`
 * locking the thread for moderator review. Self-reports are rejected.
 */
export async function createReport(
  deps: CreateReportDeps,
  ctx: CreateReportContext,
  rawInput: unknown,
): Promise<CreateReportResult> {
  const input: CreateReportInput = CreateReportInputSchema.parse(rawInput);

  if (input.reportedUserId === ctx.reporterUserId) {
    throw new Error('cannot report self');
  }

  const reporterOpen = await deps.repo.countOpenReportsByReporter(
    ctx.reporterUserId,
    isoDaysAgo(deps.clock.now(), 30),
  );
  const severity = scoreSeverity({
    reason: input.reason,
    reporterPriorOpenReports: reporterOpen,
    reportedUserPriorActions: ctx.reportedUserPriorActions ?? 0,
    classifierFlagged: ctx.classifierFlagged ?? false,
  });

  const now = deps.clock.now().toISOString();
  const report: Report = {
    id: deps.ids.next(),
    reporterUserId: ctx.reporterUserId,
    reportedUserId: input.reportedUserId,
    chatThreadId: input.chatThreadId ?? null,
    reason: input.reason,
    freeText: input.freeText ?? null,
    screenshotAttachmentId: input.screenshotAttachmentId ?? null,
    status: 'open',
    severity,
    createdAt: now,
    resolvedAt: null,
    resolvedByUserId: null,
    moderationActionId: null,
  };

  await deps.repo.insertReport(report);

  let freeze: EvidenceFreeze | null = null;
  if (report.chatThreadId) {
    freeze = {
      id: deps.ids.next(),
      chatThreadId: report.chatThreadId,
      reportId: report.id,
      createdAt: now,
      expiresAt: addDaysIso(deps.clock.now(), EVIDENCE_FREEZE_DAYS),
    };
    await deps.repo.insertFreeze(freeze);
  }

  return { report, evidenceFreeze: freeze };
}

function isoDaysAgo(now: Date, days: number): string {
  return new Date(now.getTime() - days * 86_400_000).toISOString();
}

function addDaysIso(now: Date, days: number): string {
  return new Date(now.getTime() + days * 86_400_000).toISOString();
}

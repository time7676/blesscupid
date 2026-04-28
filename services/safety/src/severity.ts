import type { ReportReason } from '@blesscupid/shared';

export interface SeverityInputs {
  reason: ReportReason;
  reporterPriorOpenReports: number;
  reportedUserPriorActions: number;
  classifierFlagged: boolean;
}

/**
 * Severity score 0..100. Higher = triage sooner.
 *
 * Heuristics, not science — tuned for triage ordering. The Pastor + CEO will
 * recalibrate after first month of real reports.
 */
export function scoreSeverity(input: SeverityInputs): number {
  const reasonWeight: Record<ReportReason, number> = {
    sexual_content: 60,
    harassment: 50,
    impersonation: 40,
    other: 20,
  };

  let score = reasonWeight[input.reason];

  // Repeat-target signal: prior moderation actions on the reported user.
  score += Math.min(input.reportedUserPriorActions, 5) * 6;

  // Classifier corroboration: text/image moderation already flagged.
  if (input.classifierFlagged) score += 15;

  // Spam signal: reporter has many recent open reports.
  // Subtract trust, but bounded so legitimate complaints aren't drowned.
  score -= Math.min(input.reporterPriorOpenReports, 5) * 3;

  return clamp(score, 0, 100);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

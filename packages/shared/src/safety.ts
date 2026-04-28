import { z } from 'zod';

export const ReportReasonSchema = z.enum([
  'harassment',
  'sexual_content',
  'impersonation',
  'other',
]);
export type ReportReason = z.infer<typeof ReportReasonSchema>;

export const ReportStatusSchema = z.enum([
  'open',
  'under_review',
  'resolved',
  'dismissed',
]);
export type ReportStatus = z.infer<typeof ReportStatusSchema>;

export const ModerationActionKindSchema = z.enum([
  'dismiss',
  'warn',
  'suspend',
  'ban',
]);
export type ModerationActionKind = z.infer<typeof ModerationActionKindSchema>;

export const REPORT_FREE_TEXT_MAX = 500;
export const REPORT_SCREENSHOT_MAX_BYTES = 5 * 1024 * 1024;
export const EVIDENCE_FREEZE_DAYS = 90;
export const ACCOUNT_HARD_DELETE_DAYS = 30;

/** Payload accepted by `POST /reports`. */
export const CreateReportInputSchema = z.object({
  reportedUserId: z.string().uuid(),
  chatThreadId: z.string().uuid().optional(),
  reason: ReportReasonSchema,
  freeText: z.string().max(REPORT_FREE_TEXT_MAX).optional(),
  screenshotAttachmentId: z.string().uuid().optional(),
});
export type CreateReportInput = z.infer<typeof CreateReportInputSchema>;

export interface Report {
  id: string;
  reporterUserId: string;
  reportedUserId: string;
  chatThreadId: string | null;
  reason: ReportReason;
  freeText: string | null;
  screenshotAttachmentId: string | null;
  status: ReportStatus;
  severity: number;
  createdAt: string;
  resolvedAt: string | null;
  resolvedByUserId: string | null;
  moderationActionId: string | null;
}

/** Storage row for a bidirectional block. `userAId < userBId` enforced at write. */
export interface Block {
  userAId: string;
  userBId: string;
  initiatedByUserId: string;
  createdAt: string;
}

export interface EvidenceFreeze {
  id: string;
  chatThreadId: string;
  reportId: string;
  expiresAt: string;
  createdAt: string;
}

export const AccountDeletionStatusSchema = z.enum([
  'pending_soft',
  'soft_deleted',
  'hard_deleted',
  'cancelled',
]);
export type AccountDeletionStatus = z.infer<typeof AccountDeletionStatusSchema>;

export interface AccountDeletionRequest {
  id: string;
  userId: string;
  status: AccountDeletionStatus;
  expedited: boolean;
  requestedAt: string;
  softDeletedAt: string | null;
  hardDeleteScheduledAt: string;
  hardDeletedAt: string | null;
  cancelledAt: string | null;
}

export interface ModerationAction {
  id: string;
  reportId: string;
  actorUserId: string;
  kind: ModerationActionKind;
  notes: string | null;
  appliedAt: string;
}

/** Ordered pair helper: blocks are keyed unordered to enforce bidirectionality. */
export function orderedUserPair(a: string, b: string): [string, string] {
  if (a === b) {
    throw new Error('orderedUserPair: cannot block self');
  }
  return a < b ? [a, b] : [b, a];
}

/**
 * Moderation core types. Shared by text + image classifiers + queue.
 *
 * Every chat message and every uploaded image MUST flow through this pipeline
 * before delivery / exposure. See ADR-0001 (Holy guardrails as code).
 */

export type Decision = "allow" | "block" | "queue";

/**
 * Hard categories — block immediately, no human review.
 * Final list of categories + thresholds is owed to the Pastor.
 */
export type HardCategory =
  | "sexual"
  | "sexual_minors"
  | "self_harm"
  | "hate"
  | "violence_graphic"
  | "harassment_severe";

/**
 * Soft flags — message can be delivered, but the thread is marked for
 * review. Used for "off-platform meeting pressure" detection and similar.
 */
export type SoftFlag =
  | "off_platform_pressure"
  | "photo_request"
  | "contact_info_share"
  | "banned_phrase_soft";

export interface ModerationResult {
  decision: Decision;
  /** Hard categories that triggered a block or queue. */
  reasons: HardCategory[];
  /** Soft flags. Present even when decision === 'allow'. */
  flags: SoftFlag[];
  /** Raw provider scores, for audit + tuning. Never shown to users. */
  rawScores: Record<string, number>;
  /** Human-readable summary. Pastor-reviewed copy required before launch. */
  reviewerNote: string;
}

export interface MessageInput {
  threadId: string;
  senderUserId: string;
  recipientUserId: string;
  /** Plain text. Empty if attachment-only — moderate the attachment instead. */
  text: string;
  /** Optional attachment ids — moderate via image classifier. */
  attachmentIds?: string[];
  /** ISO timestamp at the API boundary. */
  sentAt: string;
}

export interface QueuedItem {
  id: string;
  kind: "text" | "image";
  payload: MessageInput | ImageUploadInput;
  result: ModerationResult;
  status: "pending_review" | "approved" | "rejected";
  createdAt: string;
  reviewedAt?: string;
  reviewerUserId?: string;
  reviewerNote?: string;
}

export interface ImageUploadInput {
  uploadId: string;
  uploaderUserId: string;
  /** S3/Storage key. The classifier downloads or signs a URL. */
  storageKey: string;
  /** Whether this image is intended as a profile photo (face required). */
  isProfilePhoto: boolean;
}

export interface Report {
  id: string;
  reporterUserId: string;
  reportedUserId: string;
  threadId?: string;
  messageId?: string;
  reason: ReportReason;
  freeform?: string;
  createdAt: string;
}

export type ReportReason =
  | "sexual_content"
  | "harassment"
  | "off_platform_pressure"
  | "scam_or_spam"
  | "underage"
  | "fake_profile"
  | "other";

export interface BlockRecord {
  blockerUserId: string;
  blockedUserId: string;
  createdAt: string;
}

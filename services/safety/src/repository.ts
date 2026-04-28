import type {
  AccountDeletionRequest,
  AccountDeletionStatus,
  Block,
  EvidenceFreeze,
  ModerationAction,
  Report,
  ReportStatus,
} from '@blesscupid/shared';

/**
 * Storage port for the safety service.
 *
 * Implementations: in-memory (tests), Postgres (prod, picked in BLE-6 follow-up).
 * Domain logic must not depend on a concrete DB; it only uses this interface.
 */
export interface SafetyRepository {
  // Reports
  insertReport(report: Report): Promise<void>;
  getReport(id: string): Promise<Report | null>;
  listReports(filter: { status?: ReportStatus | ReportStatus[] }): Promise<Report[]>;
  updateReportStatus(
    id: string,
    status: ReportStatus,
    resolvedAt: string | null,
    resolvedByUserId: string | null,
    moderationActionId: string | null,
  ): Promise<void>;
  countOpenReportsByReporter(reporterUserId: string, sinceIso: string): Promise<number>;

  // Blocks (keyed unordered)
  insertBlock(block: Block): Promise<void>;
  deleteBlock(userAId: string, userBId: string): Promise<boolean>;
  hasBlock(userAId: string, userBId: string): Promise<boolean>;
  listBlocksForUser(userId: string): Promise<Block[]>;

  // Evidence freezes
  insertFreeze(freeze: EvidenceFreeze): Promise<void>;
  hasActiveFreeze(chatThreadId: string, nowIso: string): Promise<boolean>;
  listExpiredFreezes(nowIso: string): Promise<EvidenceFreeze[]>;
  deleteFreeze(id: string): Promise<void>;

  // Account deletion
  insertDeletionRequest(req: AccountDeletionRequest): Promise<void>;
  getDeletionRequestForUser(userId: string): Promise<AccountDeletionRequest | null>;
  updateDeletionStatus(
    id: string,
    status: AccountDeletionStatus,
    fields: Partial<
      Pick<AccountDeletionRequest, 'softDeletedAt' | 'hardDeletedAt' | 'cancelledAt'>
    >,
  ): Promise<void>;
  listPendingHardDeletes(nowIso: string): Promise<AccountDeletionRequest[]>;

  // Moderation actions
  insertModerationAction(action: ModerationAction): Promise<void>;
  listModerationActionsForUser(userId: string): Promise<ModerationAction[]>;
}

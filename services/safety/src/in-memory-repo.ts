import type {
  AccountDeletionRequest,
  AccountDeletionStatus,
  Block,
  EvidenceFreeze,
  ModerationAction,
  Report,
  ReportStatus,
} from '@blesscupid/shared';
import type { SafetyRepository } from './repository.js';

/**
 * Reference in-memory implementation of `SafetyRepository`.
 *
 * Used by tests and for an early dev stand-up. Production swaps in a
 * Postgres-backed implementation behind the same interface.
 */
export class InMemorySafetyRepository implements SafetyRepository {
  private reports = new Map<string, Report>();
  private blocks = new Map<string, Block>();
  private freezes = new Map<string, EvidenceFreeze>();
  private deletions = new Map<string, AccountDeletionRequest>();
  private deletionByUser = new Map<string, string>();
  private actions = new Map<string, ModerationAction>();

  // Reports
  async insertReport(report: Report): Promise<void> {
    this.reports.set(report.id, { ...report });
  }
  async getReport(id: string): Promise<Report | null> {
    const r = this.reports.get(id);
    return r ? { ...r } : null;
  }
  async listReports(filter: { status?: ReportStatus | ReportStatus[] }): Promise<Report[]> {
    const allow = toStatusSet(filter.status);
    const out: Report[] = [];
    for (const r of this.reports.values()) {
      if (!allow || allow.has(r.status)) out.push({ ...r });
    }
    return out;
  }
  async updateReportStatus(
    id: string,
    status: ReportStatus,
    resolvedAt: string | null,
    resolvedByUserId: string | null,
    moderationActionId: string | null,
  ): Promise<void> {
    const r = this.reports.get(id);
    if (!r) return;
    this.reports.set(id, {
      ...r,
      status,
      resolvedAt,
      resolvedByUserId,
      moderationActionId,
    });
  }
  async countOpenReportsByReporter(
    reporterUserId: string,
    sinceIso: string,
  ): Promise<number> {
    let n = 0;
    for (const r of this.reports.values()) {
      if (
        r.reporterUserId === reporterUserId &&
        (r.status === 'open' || r.status === 'under_review') &&
        r.createdAt >= sinceIso
      ) {
        n++;
      }
    }
    return n;
  }

  // Blocks
  async insertBlock(block: Block): Promise<void> {
    this.blocks.set(blockKey(block.userAId, block.userBId), { ...block });
  }
  async deleteBlock(userAId: string, userBId: string): Promise<boolean> {
    return this.blocks.delete(blockKey(userAId, userBId));
  }
  async hasBlock(userAId: string, userBId: string): Promise<boolean> {
    return this.blocks.has(blockKey(userAId, userBId));
  }
  async listBlocksForUser(userId: string): Promise<Block[]> {
    const out: Block[] = [];
    for (const b of this.blocks.values()) {
      if (b.userAId === userId || b.userBId === userId) out.push({ ...b });
    }
    return out;
  }

  // Freezes
  async insertFreeze(freeze: EvidenceFreeze): Promise<void> {
    this.freezes.set(freeze.id, { ...freeze });
  }
  async hasActiveFreeze(chatThreadId: string, nowIso: string): Promise<boolean> {
    for (const f of this.freezes.values()) {
      if (f.chatThreadId === chatThreadId && f.expiresAt > nowIso) return true;
    }
    return false;
  }
  async listExpiredFreezes(nowIso: string): Promise<EvidenceFreeze[]> {
    const out: EvidenceFreeze[] = [];
    for (const f of this.freezes.values()) {
      if (f.expiresAt <= nowIso) out.push({ ...f });
    }
    return out;
  }
  async deleteFreeze(id: string): Promise<void> {
    this.freezes.delete(id);
  }

  // Deletion
  async insertDeletionRequest(req: AccountDeletionRequest): Promise<void> {
    this.deletions.set(req.id, { ...req });
    this.deletionByUser.set(req.userId, req.id);
  }
  async getDeletionRequestForUser(userId: string): Promise<AccountDeletionRequest | null> {
    const id = this.deletionByUser.get(userId);
    if (!id) return null;
    const r = this.deletions.get(id);
    return r ? { ...r } : null;
  }
  async updateDeletionStatus(
    id: string,
    status: AccountDeletionStatus,
    fields: Partial<
      Pick<AccountDeletionRequest, 'softDeletedAt' | 'hardDeletedAt' | 'cancelledAt'>
    >,
  ): Promise<void> {
    const r = this.deletions.get(id);
    if (!r) return;
    this.deletions.set(id, {
      ...r,
      status,
      softDeletedAt: fields.softDeletedAt ?? r.softDeletedAt,
      hardDeletedAt: fields.hardDeletedAt ?? r.hardDeletedAt,
      cancelledAt: fields.cancelledAt ?? r.cancelledAt,
    });
  }
  async listPendingHardDeletes(nowIso: string): Promise<AccountDeletionRequest[]> {
    const out: AccountDeletionRequest[] = [];
    for (const r of this.deletions.values()) {
      if (r.status === 'soft_deleted' && r.hardDeleteScheduledAt <= nowIso) {
        out.push({ ...r });
      }
    }
    return out;
  }

  // Moderation actions
  async insertModerationAction(action: ModerationAction): Promise<void> {
    this.actions.set(action.id, { ...action });
  }
  async listModerationActionsForUser(userId: string): Promise<ModerationAction[]> {
    // Looks up via reportId → reportedUserId.
    const out: ModerationAction[] = [];
    for (const a of this.actions.values()) {
      const r = this.reports.get(a.reportId);
      if (r && r.reportedUserId === userId) out.push({ ...a });
    }
    return out;
  }
}

function toStatusSet(
  s: ReportStatus | ReportStatus[] | undefined,
): Set<ReportStatus> | null {
  if (!s) return null;
  return new Set(Array.isArray(s) ? s : [s]);
}

function blockKey(a: string, b: string): string {
  return `${a}|${b}`;
}

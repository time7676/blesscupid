import type {
  BlockRecord,
  ImageUploadInput,
  MessageInput,
  ModerationResult,
  QueuedItem,
  Report,
  ReportReason,
} from "./types.js";

/**
 * Persistence interface. The Postgres impl lives in apps/api; this lib only
 * defines the contract so the pipeline + tests can run against an in-memory
 * fake.
 */
export interface ModerationStore {
  enqueue(item: QueuedItem): Promise<void>;
  /** Pending items in FIFO order, oldest first. */
  listPending(limit?: number): Promise<QueuedItem[]>;
  get(id: string): Promise<QueuedItem | undefined>;
  /** Idempotent: applying twice is a no-op after the first. */
  resolve(id: string, status: "approved" | "rejected", reviewerUserId: string, note?: string): Promise<QueuedItem | undefined>;

  /** Reports — one row per submission. */
  recordReport(report: Report): Promise<void>;
  reportsForUser(reportedUserId: string): Promise<Report[]>;

  /** Blocks — directional (blocker → blocked). One row per pair. */
  block(record: BlockRecord): Promise<void>;
  unblock(blockerUserId: string, blockedUserId: string): Promise<void>;
  isBlocked(blockerUserId: string, blockedUserId: string): Promise<boolean>;
}

export class InMemoryModerationStore implements ModerationStore {
  private items = new Map<string, QueuedItem>();
  private order: string[] = [];
  private reports: Report[] = [];
  /** key = `${blocker}|${blocked}` */
  private blocks = new Set<string>();

  async enqueue(item: QueuedItem): Promise<void> {
    if (this.items.has(item.id)) return;
    this.items.set(item.id, { ...item });
    this.order.push(item.id);
  }

  async listPending(limit?: number): Promise<QueuedItem[]> {
    const out: QueuedItem[] = [];
    for (const id of this.order) {
      const it = this.items.get(id);
      if (it && it.status === "pending_review") out.push(it);
      if (limit && out.length >= limit) break;
    }
    return out;
  }

  async get(id: string): Promise<QueuedItem | undefined> {
    const it = this.items.get(id);
    return it ? { ...it } : undefined;
  }

  async resolve(
    id: string,
    status: "approved" | "rejected",
    reviewerUserId: string,
    note?: string,
  ): Promise<QueuedItem | undefined> {
    const it = this.items.get(id);
    if (!it) return undefined;
    if (it.status !== "pending_review") return it;
    const updated: QueuedItem = {
      ...it,
      status,
      reviewerUserId,
      reviewedAt: new Date().toISOString(),
      ...(note !== undefined ? { reviewerNote: note } : {}),
    };
    this.items.set(id, updated);
    return { ...updated };
  }

  async recordReport(report: Report): Promise<void> {
    this.reports.push({ ...report });
  }

  async reportsForUser(reportedUserId: string): Promise<Report[]> {
    return this.reports.filter((r) => r.reportedUserId === reportedUserId).map((r) => ({ ...r }));
  }

  async block(record: BlockRecord): Promise<void> {
    this.blocks.add(`${record.blockerUserId}|${record.blockedUserId}`);
  }

  async unblock(blockerUserId: string, blockedUserId: string): Promise<void> {
    this.blocks.delete(`${blockerUserId}|${blockedUserId}`);
  }

  async isBlocked(blockerUserId: string, blockedUserId: string): Promise<boolean> {
    return this.blocks.has(`${blockerUserId}|${blockedUserId}`);
  }
}

export function makeQueuedItem(
  id: string,
  kind: "text" | "image",
  payload: MessageInput | ImageUploadInput,
  result: ModerationResult,
): QueuedItem {
  return {
    id,
    kind,
    payload,
    result,
    status: "pending_review",
    createdAt: new Date().toISOString(),
  };
}

export function makeReport(args: {
  id: string;
  reporterUserId: string;
  reportedUserId: string;
  reason: ReportReason;
  threadId?: string;
  messageId?: string;
  freeform?: string;
}): Report {
  return {
    id: args.id,
    reporterUserId: args.reporterUserId,
    reportedUserId: args.reportedUserId,
    reason: args.reason,
    ...(args.threadId !== undefined ? { threadId: args.threadId } : {}),
    ...(args.messageId !== undefined ? { messageId: args.messageId } : {}),
    ...(args.freeform !== undefined ? { freeform: args.freeform } : {}),
    createdAt: new Date().toISOString(),
  };
}

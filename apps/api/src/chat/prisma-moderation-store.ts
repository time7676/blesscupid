import { Injectable } from '@nestjs/common';
import {
  type BlockRecord,
  type ImageUploadInput,
  type MessageInput,
  type ModerationStore,
  type QueuedItem,
  type Report,
} from '@blesscupid/moderation';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Prisma-backed implementation of the ModerationStore contract from
 * @blesscupid/moderation. Translates the lib's plain payloads into rows on
 * ModerationQueueItem, Report, and Block.
 */
@Injectable()
export class PrismaModerationStore implements ModerationStore {
  constructor(private readonly prisma: PrismaService) {}

  async enqueue(item: QueuedItem): Promise<void> {
    const exists = await this.prisma.moderationQueueItem.findUnique({ where: { id: item.id } });
    if (exists) return;

    const flat = flattenPayload(item);
    await this.prisma.moderationQueueItem.create({
      data: {
        id: item.id,
        kind: item.kind,
        status: item.status,
        senderUserId: flat.senderUserId,
        recipientUserId: flat.recipientUserId,
        threadId: flat.threadId,
        uploadId: flat.uploadId,
        storageKey: flat.storageKey,
        bodyText: flat.bodyText,
        attachmentIds: flat.attachmentIds ?? [],
        decision: item.result.decision,
        reasons: item.result.reasons,
        flags: item.result.flags,
        rawScores: item.result.rawScores as object,
        reviewerNote: item.reviewerNote ?? item.result.reviewerNote,
        reviewerUserId: item.reviewerUserId === 'system' ? null : item.reviewerUserId,
        reviewedAt: item.reviewedAt ? new Date(item.reviewedAt) : null,
        createdAt: new Date(item.createdAt),
      },
    });
  }

  async listPending(limit = 50): Promise<QueuedItem[]> {
    const rows = await this.prisma.moderationQueueItem.findMany({
      where: { status: 'pending_review' },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    return rows.map(rowToQueuedItem);
  }

  async get(id: string): Promise<QueuedItem | undefined> {
    const row = await this.prisma.moderationQueueItem.findUnique({ where: { id } });
    return row ? rowToQueuedItem(row) : undefined;
  }

  async resolve(
    id: string,
    status: 'approved' | 'rejected',
    reviewerUserId: string,
    note?: string,
  ): Promise<QueuedItem | undefined> {
    const row = await this.prisma.moderationQueueItem.findUnique({ where: { id } });
    if (!row) return undefined;
    if (row.status !== 'pending_review') return rowToQueuedItem(row);

    const updated = await this.prisma.moderationQueueItem.update({
      where: { id },
      data: {
        status,
        reviewerUserId,
        reviewedAt: new Date(),
        ...(note !== undefined ? { reviewerNote: note } : {}),
      },
    });
    return rowToQueuedItem(updated);
  }

  async recordReport(report: Report): Promise<void> {
    const exists = await this.prisma.report.findUnique({ where: { id: report.id } });
    if (exists) return;
    await this.prisma.report.create({
      data: {
        id: report.id,
        reporterUserId: report.reporterUserId,
        reportedUserId: report.reportedUserId,
        threadId: report.threadId ?? null,
        messageId: report.messageId ?? null,
        reason: report.reason,
        freeform: report.freeform ?? null,
        createdAt: new Date(report.createdAt),
      },
    });
  }

  async reportsForUser(reportedUserId: string): Promise<Report[]> {
    const rows = await this.prisma.report.findMany({
      where: { reportedUserId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      reporterUserId: r.reporterUserId,
      reportedUserId: r.reportedUserId,
      reason: r.reason,
      ...(r.threadId ? { threadId: r.threadId } : {}),
      ...(r.messageId ? { messageId: r.messageId } : {}),
      ...(r.freeform ? { freeform: r.freeform } : {}),
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async block(record: BlockRecord): Promise<void> {
    await this.prisma.block.upsert({
      where: {
        blockerUserId_blockedUserId: {
          blockerUserId: record.blockerUserId,
          blockedUserId: record.blockedUserId,
        },
      },
      update: {},
      create: {
        blockerUserId: record.blockerUserId,
        blockedUserId: record.blockedUserId,
        createdAt: new Date(record.createdAt),
      },
    });
  }

  async unblock(blockerUserId: string, blockedUserId: string): Promise<void> {
    await this.prisma.block.deleteMany({
      where: { blockerUserId, blockedUserId },
    });
  }

  async isBlocked(blockerUserId: string, blockedUserId: string): Promise<boolean> {
    const row = await this.prisma.block.findUnique({
      where: {
        blockerUserId_blockedUserId: { blockerUserId, blockedUserId },
      },
    });
    return !!row;
  }
}

interface FlattenedPayload {
  senderUserId: string | null;
  recipientUserId: string | null;
  threadId: string | null;
  uploadId: string | null;
  storageKey: string | null;
  bodyText: string | null;
  attachmentIds: string[] | null;
}

function flattenPayload(item: QueuedItem): FlattenedPayload {
  if (item.kind === 'text') {
    const p = item.payload as MessageInput;
    return {
      senderUserId: p.senderUserId,
      recipientUserId: p.recipientUserId,
      threadId: p.threadId,
      uploadId: null,
      storageKey: null,
      bodyText: p.text,
      attachmentIds: p.attachmentIds ?? [],
    };
  }
  const p = item.payload as ImageUploadInput;
  return {
    senderUserId: p.uploaderUserId,
    recipientUserId: null,
    threadId: null,
    uploadId: p.uploadId,
    storageKey: p.storageKey,
    bodyText: null,
    attachmentIds: null,
  };
}

interface DbRow {
  id: string;
  kind: 'text' | 'image';
  status: 'pending_review' | 'approved' | 'rejected';
  senderUserId: string | null;
  recipientUserId: string | null;
  threadId: string | null;
  uploadId: string | null;
  storageKey: string | null;
  bodyText: string | null;
  attachmentIds: string[];
  decision: string;
  reasons: string[];
  flags: string[];
  rawScores: unknown;
  reviewerNote: string | null;
  reviewerUserId: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

function rowToQueuedItem(row: DbRow): QueuedItem {
  const payload =
    row.kind === 'text'
      ? ({
          threadId: row.threadId ?? '',
          senderUserId: row.senderUserId ?? '',
          recipientUserId: row.recipientUserId ?? '',
          text: row.bodyText ?? '',
          ...(row.attachmentIds.length ? { attachmentIds: row.attachmentIds } : {}),
          sentAt: row.createdAt.toISOString(),
        } satisfies MessageInput)
      : ({
          uploadId: row.uploadId ?? '',
          uploaderUserId: row.senderUserId ?? '',
          storageKey: row.storageKey ?? '',
          isProfilePhoto: false,
        } satisfies ImageUploadInput);

  return {
    id: row.id,
    kind: row.kind,
    payload,
    result: {
      decision: row.decision as 'allow' | 'block' | 'queue',
      reasons: row.reasons as never,
      flags: row.flags as never,
      rawScores: (row.rawScores ?? {}) as Record<string, number>,
      reviewerNote: row.reviewerNote ?? '',
    },
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    ...(row.reviewedAt ? { reviewedAt: row.reviewedAt.toISOString() } : {}),
    ...(row.reviewerUserId ? { reviewerUserId: row.reviewerUserId } : {}),
    ...(row.reviewerNote ? { reviewerNote: row.reviewerNote } : {}),
  };
}

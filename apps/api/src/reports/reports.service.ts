import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { makeReport, type ReportReason } from '@blesscupid/moderation';
import { PrismaService } from '../prisma/prisma.service.js';
import { PrismaModerationStore } from '../chat/prisma-moderation-store.js';

export interface CreateReportInput {
  reportedUserId: string;
  reason: ReportReason;
  threadId?: string;
  messageId?: string;
  freeform?: string;
}

export type ModerationActionKind = 'dismiss' | 'warn' | 'suspend' | 'ban';

export interface ApplyActionInput {
  reportId: string;
  actorUserId: string;
  kind: ModerationActionKind;
  notes?: string;
}

/** BLE-10 — chat-thread freeze duration on a report. */
export const EVIDENCE_FREEZE_DAYS = 90;

const REASON_WEIGHT: Record<string, number> = {
  sexual_content: 60,
  underage: 90,
  harassment: 50,
  off_platform_pressure: 35,
  scam_or_spam: 30,
  fake_profile: 30,
  impersonation: 40,
  other: 20,
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly store: PrismaModerationStore,
  ) {}

  async create(reporterUserId: string, input: CreateReportInput) {
    if (input.reportedUserId === reporterUserId) {
      throw new BadRequestException({ code: 'cannot_report_self' });
    }

    const report = makeReport({
      id: crypto.randomUUID(),
      reporterUserId,
      reportedUserId: input.reportedUserId,
      reason: input.reason,
      ...(input.threadId ? { threadId: input.threadId } : {}),
      ...(input.messageId ? { messageId: input.messageId } : {}),
      ...(input.freeform ? { freeform: input.freeform } : {}),
    });
    await this.store.recordReport(report);

    // BLE-10 triage fields. moderation/makeReport doesn't know about these,
    // so patch them on after the row is in place.
    const severity = this.computeSeverity(input.reason);
    await this.prisma.report.update({
      where: { id: report.id },
      data: { severity, status: 'open' },
    });

    // Evidence preservation: 90-day server-side freeze on the chat thread.
    if (input.threadId) {
      await this.prisma.evidenceFreeze.create({
        data: {
          reportId: report.id,
          threadId: input.threadId,
          expiresAt: new Date(Date.now() + EVIDENCE_FREEZE_DAYS * 86_400_000),
        },
      });
    }

    return { id: report.id, createdAt: report.createdAt, severity };
  }

  async listAll(limit = 100) {
    const rows = await this.prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        reporterUserId: true,
        reportedUserId: true,
        threadId: true,
        messageId: true,
        reason: true,
        freeform: true,
        severity: true,
        status: true,
        resolvedAt: true,
        resolvedByUserId: true,
        createdAt: true,
      },
    });
    return { reports: rows };
  }

  /**
   * T&S triage queue ordered by severity desc, then age asc.
   * Pastor + CEO consume this view from `GET /admin/safety/queue`.
   */
  async listTriageQueue(limit = 50) {
    const rows = await this.prisma.report.findMany({
      where: { status: { in: ['open', 'under_review'] } },
      orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
      take: limit,
      select: {
        id: true,
        reporterUserId: true,
        reportedUserId: true,
        threadId: true,
        reason: true,
        freeform: true,
        severity: true,
        status: true,
        createdAt: true,
      },
    });
    return { items: rows };
  }

  async listForUser(reportedUserId: string) {
    return this.store.reportsForUser(reportedUserId);
  }

  /**
   * Pastor / CEO applies a moderation decision from the T&S queue.
   * Records the action for audit, resolves the linked report, and on
   * `suspend` / `ban` flips `User.isSuspended` so the user is locked out.
   * Returns the persisted action + the now-closed report.
   */
  async applyModerationAction(input: ApplyActionInput) {
    const report = await this.prisma.report.findUnique({
      where: { id: input.reportId },
    });
    if (!report) {
      throw new NotFoundException({ code: 'report_not_found' });
    }
    if (report.status === 'resolved' || report.status === 'dismissed') {
      throw new BadRequestException({
        code: 'report_already_closed',
        status: report.status,
      });
    }

    const now = new Date();
    const newStatus = input.kind === 'dismiss' ? 'dismissed' : 'resolved';

    const [, action] = await this.prisma.$transaction([
      this.prisma.report.update({
        where: { id: report.id },
        data: {
          status: newStatus,
          resolvedAt: now,
          resolvedByUserId: input.actorUserId,
        },
      }),
      this.prisma.moderationAction.create({
        data: {
          reportId: report.id,
          actorUserId: input.actorUserId,
          kind: input.kind,
          notes: input.notes ?? null,
          appliedAt: now,
        },
      }),
      // suspend / ban → flip User.isSuspended on the reported user.
      ...(input.kind === 'suspend' || input.kind === 'ban'
        ? [
            this.prisma.user.update({
              where: { id: report.reportedUserId },
              data: { isSuspended: true },
            }),
          ]
        : []),
    ]);

    // Patch moderationActionId after the action row exists so the FK is
    // pointing at a real row.
    await this.prisma.report.update({
      where: { id: report.id },
      data: { moderationActionId: action.id },
    });

    return {
      action: {
        id: action.id,
        reportId: action.reportId,
        actorUserId: action.actorUserId,
        kind: action.kind,
        notes: action.notes,
        appliedAt: action.appliedAt.toISOString(),
      },
      report: {
        id: report.id,
        status: newStatus,
        resolvedAt: now.toISOString(),
        resolvedByUserId: input.actorUserId,
        moderationActionId: action.id,
      },
    };
  }

  private computeSeverity(reason: string): number {
    const w = REASON_WEIGHT[reason] ?? 20;
    return Math.max(0, Math.min(100, w));
  }
}

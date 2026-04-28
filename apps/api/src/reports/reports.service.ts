import { BadRequestException, Injectable } from '@nestjs/common';
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

  private computeSeverity(reason: string): number {
    const w = REASON_WEIGHT[reason] ?? 20;
    return Math.max(0, Math.min(100, w));
  }
}

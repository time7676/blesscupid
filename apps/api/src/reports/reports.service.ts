import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, ReportReason } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * v1-restart Reports surface.
 *
 * Drops legacy `EvidenceFreeze`, `ModerationAction`, `routing` /
 * `queue-acl` modules. Reports are simple `Report` rows with `status` +
 * optional `resolution` string. Admin actions: dismiss / warn / suspend7d
 * / ban — `suspend7d` and `ban` flip `User.isSuspended` on the reported
 * user. Optional `autoBlock` on create writes both directions of `Block`.
 */
export interface CreateReportInput {
  reportedUserId: string;
  reason: ReportReason;
  detail?: string;
  threadId?: string;
  messageId?: string;
  autoBlock?: boolean;
}

export type ResolutionAction = 'dismiss' | 'warn' | 'suspend7d' | 'ban';

export interface ResolveReportInput {
  reportId: string;
  actorUserId: string;
  resolution: string;
  action?: ResolutionAction;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reporterUserId: string, input: CreateReportInput) {
    if (input.reportedUserId === reporterUserId) {
      throw new BadRequestException({ code: 'cannot_report_self' });
    }

    const report = await this.prisma.report.create({
      data: {
        reporterUserId,
        reportedUserId: input.reportedUserId,
        reason: input.reason,
        ...(input.detail ? { detail: input.detail } : {}),
        ...(input.threadId ? { threadId: input.threadId } : {}),
        ...(input.messageId ? { messageId: input.messageId } : {}),
        status: 'open',
      },
    });

    if (input.autoBlock) {
      // Bidirectional block: reporter <-> reported.
      await this.prisma.block.upsert({
        where: {
          blockerUserId_blockedUserId: {
            blockerUserId: reporterUserId,
            blockedUserId: input.reportedUserId,
          },
        },
        update: {},
        create: {
          blockerUserId: reporterUserId,
          blockedUserId: input.reportedUserId,
        },
      });
      await this.prisma.block.upsert({
        where: {
          blockerUserId_blockedUserId: {
            blockerUserId: input.reportedUserId,
            blockedUserId: reporterUserId,
          },
        },
        update: {},
        create: {
          blockerUserId: input.reportedUserId,
          blockedUserId: reporterUserId,
        },
      });
    }

    return {
      id: report.id,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
    };
  }

  /**
   * Admin cursor-paginated open-report list. Returns reporter + reported
   * user summaries; reporter is REDACTED when `reporterDeleted=true` (User
   * row was hard-deleted via cascade on a SET NULL FK).
   */
  async listOpen(opts: { cursor?: string; limit?: number } = {}) {
    const limit = Math.min(opts.limit ?? 50, 200);
    const where: Prisma.ReportWhereInput = { status: 'open' };
    const rows = await this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        reporterUserId: true,
        reporterDeleted: true,
        reportedUserId: true,
        reason: true,
        detail: true,
        threadId: true,
        messageId: true,
        status: true,
        createdAt: true,
        reporter: {
          select: { id: true, email: true, role: true, deletedAt: true },
        },
        reported: {
          select: {
            id: true,
            email: true,
            role: true,
            isSuspended: true,
            deletedAt: true,
          },
        },
      },
    });

    const hasMore = rows.length > limit;
    const items = (hasMore ? rows.slice(0, limit) : rows).map((r) => ({
      id: r.id,
      reason: r.reason,
      detail: r.detail,
      threadId: r.threadId,
      messageId: r.messageId,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      reporter: r.reporterDeleted ? null : r.reporter,
      reported: r.reported,
    }));

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  }

  async resolve(input: ResolveReportInput) {
    const report = await this.prisma.report.findUnique({
      where: { id: input.reportId },
    });
    if (!report) {
      throw new NotFoundException({ code: 'report_not_found' });
    }
    if (report.status === 'resolved') {
      throw new BadRequestException({ code: 'report_already_resolved' });
    }

    const now = new Date();
    const ops: Prisma.PrismaPromise<unknown>[] = [
      this.prisma.report.update({
        where: { id: report.id },
        data: {
          status: 'resolved',
          reviewerUserId: input.actorUserId,
          reviewedAt: now,
          resolution: input.action
            ? `${input.action}: ${input.resolution}`
            : input.resolution,
        },
      }),
    ];

    if (input.action === 'suspend7d' || input.action === 'ban') {
      ops.push(
        this.prisma.user.update({
          where: { id: report.reportedUserId },
          data: { isSuspended: true },
        }),
      );
    }

    await this.prisma.$transaction(ops);

    return {
      id: report.id,
      status: 'resolved' as const,
      resolution: input.resolution,
      action: input.action ?? null,
      reviewedAt: now.toISOString(),
    };
  }
}

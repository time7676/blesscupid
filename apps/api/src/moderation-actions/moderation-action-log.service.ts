// BLE-63 — owner of moderation_action_log writes + reads.
//
// Every plaintext read of evidence appends a row to EvidenceDecryptionAudit.
// All ceo_p0 access goes through canAccessQueue; non-CEO/Pastor reads throw
// QueueAccessDeniedError, which the controller maps to 403.

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  AppealStatus,
  ModerationQueue,
  ModerationTier,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { decryptEvidence, encryptEvidence } from './evidence-cipher.js';
import { canAccessQueue, QueueAccessDeniedError } from './queue-acl.js';

export interface CreateActionLogInput {
  userId: string;
  actorUserId: string;
  tier: ModerationTier;
  ruleId: string;
  predicateId?: string;
  evidence?: string;
  /** A.2: defaults true unless queue === ceo_p0. Service enforces. */
  evidenceUserVisible?: boolean;
  appealUrl?: string;
  appealStatus?: AppealStatus;
  pastorReviewedAt?: Date;
  queue: ModerationQueue;
  reportId?: string;
  notes?: string;
}

export interface ReadEvidenceContext {
  readerUserId: string;
  readerRole: UserRole;
  reason: string;
}

@Injectable()
export class ModerationActionLogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateActionLogInput) {
    // A.2 invariant: P0 rows MUST have evidence_user_visible = false.
    const visible =
      input.queue === 'ceo_p0' ? false : (input.evidenceUserVisible ?? true);

    const priorActions90d = await this.countPriorActions(input.userId);

    const enc = input.evidence ? encryptEvidence(input.evidence) : null;

    return this.prisma.moderationActionLog.create({
      data: {
        userId: input.userId,
        actorUserId: input.actorUserId,
        tier: input.tier,
        ruleId: input.ruleId,
        predicateId: input.predicateId ?? null,
        evidenceCipher: enc?.cipher ?? null,
        evidenceIv: enc?.iv ?? null,
        evidenceAuthTag: enc?.authTag ?? null,
        evidenceWrappedKey: enc?.wrappedKey ?? null,
        evidenceUserVisible: visible,
        appealUrl: input.appealUrl ?? null,
        appealStatus: input.appealStatus ?? 'none',
        priorActions90d,
        pastorReviewedAt: input.pastorReviewedAt ?? null,
        queue: input.queue,
        reportId: input.reportId ?? null,
        notes: input.notes ?? null,
      },
    });
  }

  async getMetadata(actionLogId: string, readerRole: UserRole) {
    const row = await this.prisma.moderationActionLog.findUnique({
      where: { id: actionLogId },
    });
    if (!row) throw new NotFoundException({ code: 'action_log_not_found' });
    if (canAccessQueue(readerRole, row.queue) === 'deny') {
      throw new ForbiddenException({ code: 'queue_access_denied', queue: row.queue });
    }
    const {
      evidenceCipher: _c,
      evidenceIv: _i,
      evidenceAuthTag: _t,
      evidenceWrappedKey: _w,
      ...meta
    } = row;
    return { ...meta, hasEvidence: row.evidenceCipher !== null };
  }

  async readEvidence(actionLogId: string, ctx: ReadEvidenceContext): Promise<string> {
    const row = await this.prisma.moderationActionLog.findUnique({
      where: { id: actionLogId },
    });
    if (!row) throw new NotFoundException({ code: 'action_log_not_found' });
    if (canAccessQueue(ctx.readerRole, row.queue) === 'deny') {
      throw new QueueAccessDeniedError(row.queue);
    }
    if (
      !row.evidenceCipher ||
      !row.evidenceIv ||
      !row.evidenceAuthTag ||
      !row.evidenceWrappedKey
    ) {
      throw new NotFoundException({ code: 'no_evidence' });
    }

    const plaintext = decryptEvidence({
      cipher: row.evidenceCipher,
      iv: row.evidenceIv,
      authTag: row.evidenceAuthTag,
      wrappedKey: row.evidenceWrappedKey,
    });

    await this.prisma.evidenceDecryptionAudit.create({
      data: {
        actionLogId: row.id,
        readerUserId: ctx.readerUserId,
        readerRole: ctx.readerRole,
        reason: ctx.reason,
      },
    });

    return plaintext;
  }

  private async countPriorActions(userId: string): Promise<number> {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000);
    return this.prisma.moderationActionLog.count({
      where: { userId, createdAt: { gte: ninetyDaysAgo } },
    });
  }
}

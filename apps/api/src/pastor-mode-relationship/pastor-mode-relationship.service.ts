// BLE-131 — Pastor-mode relationship lifecycle service.
//
// Owns the 1:1 audited-side rule: at most one PastorModeRelationship in
// status=`active` per auditedUserId. Two enforcement layers:
//
//   1) `accept()` runs in a Serializable transaction. Before flipping the
//      invitation row to `active`, it counts the audited user's currently
//      active relationships. If >0, throws PastorModeAlreadyPairedException
//      (HTTP 409 with gate copy from
//      `PASTOR_MODE_COPY.invite_gate_already_paired_*`).
//
//   2) The DB has a partial unique index
//      `pastor_mode_relationship_one_active_per_audited` on
//      `(auditedUserId) WHERE status='active'`. If two `accept()` calls
//      somehow race past the application-level check, Postgres rejects
//      the second commit with a 23505 unique-violation, which the service
//      catches and translates to the same already-paired error.
//
// Pastor side has no cap — pastorUserId may have N concurrent active rows.
//
// Sibling tickets that touch this state machine:
//   - BLE-132 (24h transcript seal on revoke): set pastorSealDueAt when
//     status flips to `ended_by_audited`. Worker reads that to lock pastor
//     visibility — implemented in BLE-132.
//   - BLE-133 (silent transition on revoke): pastor receives no push or
//     in-app banner. We emit no event to pastor in revoke().
//   - BLE-136 (18+ KYC gate): accept() requires
//     PastorModeGate.status='passed' on the audited side.

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PASTOR_MODE_COPY,
  PASTOR_MODE_INVITE_GATE_REASONS,
  PASTOR_MODE_RELATIONSHIP_STATUS,
  evaluatePastorInviteAcceptance,
  pastorSealDueAt,
  relationshipDurationDays,
  renderHistoryRowDuration,
  renderInviteAlreadyPairedCopy,
  revocationStatusForActor,
  type PastorModeInviteGateReason,
  type PastorModeRevocationActor,
} from '@blesscupid/shared';
import { PrismaService } from '../prisma/prisma.service.js';

export type AuditedUserView = {
  active: ActiveRelationshipDto | null;
  pendingInvites: PendingInviteDto[];
  history: HistoryRowDto[];
};

export type ActiveRelationshipDto = {
  id: string;
  pastorUserId: string;
  pastorDisplayName: string | null;
  acceptedAt: string;
};

export type PendingInviteDto = {
  id: string;
  pastorUserId: string;
  pastorDisplayName: string | null;
  invitedAt: string;
  inviteNote: string | null;
  // When non-null, this invite cannot be accepted right now because the
  // audited user already has an active pastor. Surface 2 displays this
  // copy verbatim instead of a `Terima` button.
  blockedReason: PastorModeInviteGateReason | null;
  blockedCopy: string | null;
  blockedCopyId: typeof PASTOR_MODE_COPY.invite_gate_already_paired_id | null;
};

export type HistoryRowDto = {
  id: string;
  pastorUserId: string;
  pastorDisplayName: string | null;
  status: 'ended_by_audited' | 'ended_by_pastor' | 'declined_by_audited' | 'expired';
  durationDays: number;
  durationLabel: string;
  acceptedAt: string | null;
  endedAt: string;
};

export type PastorSidebarEntry = {
  id: string;
  auditedUserId: string;
  auditedDisplayName: string | null;
  status: 'active' | 'ended_by_audited' | 'ended_by_pastor' | 'declined_by_audited' | 'expired';
  acceptedAt: string | null;
  endedAt: string | null;
  durationDays: number;
  durationLabel: string;
};

export class PastorModeAlreadyPairedException extends ConflictException {
  constructor(activePastorName: string | null) {
    super({
      code: 'pastor_mode_already_paired',
      reason: PASTOR_MODE_INVITE_GATE_REASONS.already_paired,
      messageId: PASTOR_MODE_COPY.invite_gate_already_paired_id,
      message: renderInviteAlreadyPairedCopy(activePastorName ?? 'Anda'),
    });
  }
}

@Injectable()
export class PastorModeRelationshipService {
  private readonly log = new Logger('PastorModeRelationshipService');

  constructor(private readonly prisma: PrismaService) {}

  // === Pastor-side: send invitation ====================================

  async invite(input: {
    pastorUserId: string;
    auditedUserId: string;
    inviteNote?: string;
  }): Promise<{ id: string }> {
    if (input.pastorUserId === input.auditedUserId) {
      throw new ForbiddenException({ code: 'pastor_mode_invite_self' });
    }
    const created = await this.prisma.pastorModeRelationship.create({
      data: {
        pastorUserId: input.pastorUserId,
        auditedUserId: input.auditedUserId,
        status: PASTOR_MODE_RELATIONSHIP_STATUS.pending,
        inviteNote: input.inviteNote,
      },
      select: { id: true },
    });
    return { id: created.id };
  }

  // === Audited-side: accept invitation =================================
  //
  // The teeth of BLE-131. Run inside a Serializable transaction; reject
  // when the audited user already has an active relationship.
  async accept(input: { invitationId: string; auditedUserId: string }): Promise<{ id: string }> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const invite = await tx.pastorModeRelationship.findUnique({
            where: { id: input.invitationId },
            select: {
              id: true,
              auditedUserId: true,
              pastorUserId: true,
              status: true,
            },
          });
          if (!invite) throw new NotFoundException({ code: 'pastor_mode_invite_not_found' });

          // BLE-136 18+ gate. If the user has no PastorModeGate row, treat
          // as not-passed — the audited surface should never expose accept
          // until KYC passes.
          const ageGate = await tx.pastorModeGate.findUnique({
            where: { userId: input.auditedUserId },
            select: { status: true },
          });

          const activeCount = await tx.pastorModeRelationship.count({
            where: {
              auditedUserId: input.auditedUserId,
              status: PASTOR_MODE_RELATIONSHIP_STATUS.active,
            },
          });

          const decision = evaluatePastorInviteAcceptance({
            inviteStatus: invite.status as
              | 'pending'
              | 'active'
              | 'ended_by_audited'
              | 'ended_by_pastor'
              | 'declined_by_audited'
              | 'expired',
            hasActiveRelationship: activeCount > 0,
            acceptingUserIsInvitee: invite.auditedUserId === input.auditedUserId,
            pastorIsDifferentUser: invite.pastorUserId !== input.auditedUserId,
            ageGatePassed: ageGate?.status === 'passed',
          });

          if (!decision.acceptable) {
            if (decision.reason === PASTOR_MODE_INVITE_GATE_REASONS.already_paired) {
              const active = await tx.pastorModeRelationship.findFirst({
                where: {
                  auditedUserId: input.auditedUserId,
                  status: PASTOR_MODE_RELATIONSHIP_STATUS.active,
                },
                select: {
                  pastor: { select: { profile: { select: { displayName: true } } } },
                },
              });
              throw new PastorModeAlreadyPairedException(
                active?.pastor.profile?.displayName ?? null,
              );
            }
            if (decision.reason === PASTOR_MODE_INVITE_GATE_REASONS.not_invitee) {
              throw new ForbiddenException({ code: 'pastor_mode_not_invitee' });
            }
            if (decision.reason === PASTOR_MODE_INVITE_GATE_REASONS.invite_self) {
              throw new ForbiddenException({ code: 'pastor_mode_invite_self' });
            }
            if (decision.reason === PASTOR_MODE_INVITE_GATE_REASONS.age_gate_not_passed) {
              throw new ForbiddenException({ code: 'pastor_mode_age_gate_not_passed' });
            }
            // invite_not_pending or invite_expired
            throw new ConflictException({
              code: 'pastor_mode_invite_unavailable',
              reason: decision.reason,
            });
          }

          const now = new Date();
          const updated = await tx.pastorModeRelationship.update({
            where: { id: invite.id },
            data: {
              status: PASTOR_MODE_RELATIONSHIP_STATUS.active,
              acceptedAt: now,
            },
            select: { id: true },
          });
          return updated;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (e) {
      // Postgres unique-violation on the partial index — a concurrent
      // accept() race that beat us to the active row. Translate to the
      // same already-paired error for a single doctrinal surface.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002' &&
        Array.isArray(e.meta?.target) &&
        (e.meta?.target as string[]).includes('pastor_mode_relationship_one_active_per_audited')
      ) {
        this.log.warn(
          `accept race lost on partial unique; translating to already_paired (audited=${input.auditedUserId})`,
        );
        throw new PastorModeAlreadyPairedException(null);
      }
      throw e;
    }
  }

  // === Decline invitation ==============================================

  async decline(input: { invitationId: string; auditedUserId: string }): Promise<void> {
    const invite = await this.prisma.pastorModeRelationship.findUnique({
      where: { id: input.invitationId },
      select: { auditedUserId: true, status: true },
    });
    if (!invite) throw new NotFoundException({ code: 'pastor_mode_invite_not_found' });
    if (invite.auditedUserId !== input.auditedUserId) {
      throw new ForbiddenException({ code: 'pastor_mode_not_invitee' });
    }
    if (invite.status !== PASTOR_MODE_RELATIONSHIP_STATUS.pending) {
      throw new ConflictException({
        code: 'pastor_mode_invite_unavailable',
        reason: PASTOR_MODE_INVITE_GATE_REASONS.invite_not_pending,
      });
    }
    await this.prisma.pastorModeRelationship.update({
      where: { id: input.invitationId },
      data: {
        status: PASTOR_MODE_RELATIONSHIP_STATUS.declined_by_audited,
        endedAt: new Date(),
      },
    });
  }

  // === Revoke (audited or pastor) ======================================
  //
  // BLE-133 silent-transition: do NOT push to the pastor on audited revoke.
  // BLE-132 hook: when actor=audited, set pastorSealDueAt = endedAt + 24h.

  async revoke(input: {
    relationshipId: string;
    actorUserId: string;
    actor: PastorModeRevocationActor;
  }): Promise<void> {
    const rel = await this.prisma.pastorModeRelationship.findUnique({
      where: { id: input.relationshipId },
      select: { id: true, auditedUserId: true, pastorUserId: true, status: true },
    });
    if (!rel) throw new NotFoundException({ code: 'pastor_mode_relationship_not_found' });

    if (input.actor === 'audited' && rel.auditedUserId !== input.actorUserId) {
      throw new ForbiddenException({ code: 'pastor_mode_not_audited_party' });
    }
    if (input.actor === 'pastor' && rel.pastorUserId !== input.actorUserId) {
      throw new ForbiddenException({ code: 'pastor_mode_not_pastor_party' });
    }
    if (rel.status !== PASTOR_MODE_RELATIONSHIP_STATUS.active) {
      throw new ConflictException({ code: 'pastor_mode_not_active' });
    }

    const now = new Date();
    const newStatus = revocationStatusForActor(input.actor);
    await this.prisma.pastorModeRelationship.update({
      where: { id: rel.id },
      data: {
        status: newStatus,
        endedAt: now,
        // BLE-132: schedule pastor's transcript seal 24h after audited revoke.
        pastorSealDueAt:
          input.actor === 'audited' ? pastorSealDueAt(now) : null,
      },
    });
  }

  // === Audited-side composite read =====================================
  //
  // Powers Surface 2 (active + pending invites) and Surface 6 (history).
  // History rows are read-only — no resurrection CTA.

  async getAuditedUserView(auditedUserId: string): Promise<AuditedUserView> {
    const [activeRow, pendings, closedRows] = await Promise.all([
      this.prisma.pastorModeRelationship.findFirst({
        where: {
          auditedUserId,
          status: PASTOR_MODE_RELATIONSHIP_STATUS.active,
        },
        select: {
          id: true,
          pastorUserId: true,
          acceptedAt: true,
          pastor: { select: { profile: { select: { displayName: true } } } },
        },
      }),
      this.prisma.pastorModeRelationship.findMany({
        where: {
          auditedUserId,
          status: PASTOR_MODE_RELATIONSHIP_STATUS.pending,
        },
        orderBy: { invitedAt: 'desc' },
        select: {
          id: true,
          pastorUserId: true,
          invitedAt: true,
          inviteNote: true,
          pastor: { select: { profile: { select: { displayName: true } } } },
        },
      }),
      this.prisma.pastorModeRelationship.findMany({
        where: {
          auditedUserId,
          status: {
            in: [
              PASTOR_MODE_RELATIONSHIP_STATUS.ended_by_audited,
              PASTOR_MODE_RELATIONSHIP_STATUS.ended_by_pastor,
              PASTOR_MODE_RELATIONSHIP_STATUS.declined_by_audited,
              PASTOR_MODE_RELATIONSHIP_STATUS.expired,
            ],
          },
        },
        orderBy: { endedAt: 'desc' },
        select: {
          id: true,
          pastorUserId: true,
          status: true,
          acceptedAt: true,
          endedAt: true,
          pastor: { select: { profile: { select: { displayName: true } } } },
        },
      }),
    ]);

    const active: ActiveRelationshipDto | null = activeRow
      ? {
          id: activeRow.id,
          pastorUserId: activeRow.pastorUserId,
          pastorDisplayName: activeRow.pastor.profile?.displayName ?? null,
          acceptedAt: activeRow.acceptedAt!.toISOString(),
        }
      : null;

    const blockedCopy =
      active !== null
        ? renderInviteAlreadyPairedCopy(active.pastorDisplayName ?? 'Anda')
        : null;

    const pendingInvites: PendingInviteDto[] = pendings.map((p) => ({
      id: p.id,
      pastorUserId: p.pastorUserId,
      pastorDisplayName: p.pastor.profile?.displayName ?? null,
      invitedAt: p.invitedAt.toISOString(),
      inviteNote: p.inviteNote ?? null,
      blockedReason: active ? PASTOR_MODE_INVITE_GATE_REASONS.already_paired : null,
      blockedCopy: active ? blockedCopy : null,
      blockedCopyId: active ? PASTOR_MODE_COPY.invite_gate_already_paired_id : null,
    }));

    const history: HistoryRowDto[] = closedRows.map((row) => {
      const days = relationshipDurationDays(row.acceptedAt, row.endedAt);
      return {
        id: row.id,
        pastorUserId: row.pastorUserId,
        pastorDisplayName: row.pastor.profile?.displayName ?? null,
        status: row.status as HistoryRowDto['status'],
        durationDays: days,
        durationLabel: renderHistoryRowDuration(days),
        acceptedAt: row.acceptedAt?.toISOString() ?? null,
        endedAt: (row.endedAt ?? new Date(0)).toISOString(),
      };
    });

    return { active, pendingInvites, history };
  }

  // === Pastor-side sidebar =============================================
  //
  // Surface 7: pastor sees N concurrent walks (active) + closed walks
  // (sealed transcripts after BLE-132 worker fires).

  async getPastorSidebar(pastorUserId: string): Promise<PastorSidebarEntry[]> {
    const rows = await this.prisma.pastorModeRelationship.findMany({
      where: {
        pastorUserId,
        status: {
          in: [
            PASTOR_MODE_RELATIONSHIP_STATUS.active,
            PASTOR_MODE_RELATIONSHIP_STATUS.ended_by_audited,
            PASTOR_MODE_RELATIONSHIP_STATUS.ended_by_pastor,
            PASTOR_MODE_RELATIONSHIP_STATUS.declined_by_audited,
            PASTOR_MODE_RELATIONSHIP_STATUS.expired,
          ],
        },
      },
      orderBy: [{ status: 'asc' }, { acceptedAt: 'desc' }, { invitedAt: 'desc' }],
      select: {
        id: true,
        auditedUserId: true,
        status: true,
        acceptedAt: true,
        endedAt: true,
        audited: { select: { profile: { select: { displayName: true } } } },
      },
    });

    return rows.map((r) => {
      const days = relationshipDurationDays(r.acceptedAt, r.endedAt ?? new Date());
      return {
        id: r.id,
        auditedUserId: r.auditedUserId,
        auditedDisplayName: r.audited.profile?.displayName ?? null,
        status: r.status as PastorSidebarEntry['status'],
        acceptedAt: r.acceptedAt?.toISOString() ?? null,
        endedAt: r.endedAt?.toISOString() ?? null,
        durationDays: days,
        durationLabel: renderHistoryRowDuration(days),
      };
    });
  }
}

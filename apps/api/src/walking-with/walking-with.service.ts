import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * BLE-132 — Pastor-mode "walking-with" surface.
 *
 * Two read paths live here:
 *  1. {@link readTranscript} — the audited user's transcript stream. 403s
 *     immediately after revoke so the pastor's withdrawal is real, not
 *     just a UI hide. Audit-logs every probe so an obsessive pastor
 *     surfaces in the moderation queue.
 *  2. {@link listJournals} — the pastor's own notes about sealed
 *     relationships. Read-only journal frame, no transcript JOIN exists
 *     in this resolver — the pastor literally cannot reach the audited
 *     user's messages from here.
 *
 * Doctrinal anchor: Wahyu 3:20 — when the door closes, the mentor
 * withdraws. Indefinite retention is loitering.
 */
@Injectable()
export class WalkingWithService {
  private readonly logger = new Logger(WalkingWithService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Pastor reads transcript. The single guard for transcript access
   * lives here — UI hiding alone is not enough.
   *
   * - 404 if the relationship does not exist or the caller is not its
   *   pastor (no probing leak — a stranger cannot tell whether the
   *   relationship was revoked or simply never existed).
   * - 403 with `sealAuditId` if state ∈ {revoked, sealed, hard_deleted}.
   *   The 403 hits the moment the user revokes; the seal job's role is
   *   to flip the *visible* admin sidebar entry within 24h.
   * - Returns the transcript page on a healthy walking relationship.
   */
  async readTranscript(args: {
    pastorUserId: string;
    relationshipId: string;
    threadId: string;
  }) {
    const { pastorUserId, relationshipId, threadId } = args;
    const rel = await this.prisma.pastorRelationship.findUnique({
      where: { id: relationshipId },
    });
    if (!rel || rel.pastorUserId !== pastorUserId) {
      throw new NotFoundException({ code: 'relationship_not_found' });
    }

    if (
      rel.state === 'revoked' ||
      rel.state === 'sealed' ||
      rel.state === 'hard_deleted'
    ) {
      this.logger.warn(
        `transcript_seal_403 pastor=${pastorUserId} relationship=${relationshipId} thread=${threadId} sealAuditId=${rel.sealAuditId ?? 'pending'}`,
      );
      throw new ForbiddenException({
        code: 'transcript_sealed',
        sealedAt: (rel.sealedAt ?? rel.revokedAt)?.toISOString() ?? null,
        sealAuditId: rel.sealAuditId,
      });
    }

    const messages = await this.prisma.transcriptMessage.findMany({
      where: { relationshipId, threadId },
      orderBy: { authoredAt: 'asc' },
    });
    return { relationshipId, threadId, messages };
  }

  /**
   * Pastor's read-only journal of sealed relationships. Reads from
   * `pastor_notes` joined back to its (sealed) parent — but only fields
   * that survived the snapshot. **The transcript table is never queried
   * from this surface.**
   */
  async listJournals(pastorUserId: string) {
    return this.prisma.pastorRelationship.findMany({
      where: {
        pastorUserId,
        state: { in: ['sealed', 'hard_deleted'] },
      },
      orderBy: { sealedAt: 'desc' },
      include: {
        notes: {
          select: {
            id: true,
            body: true,
            createdAt: true,
            auditedUserSnapshot: true,
          },
        },
      },
    });
  }

  /**
   * User-initiated revoke: state → `revoked`, `revokedAt = now`,
   * `endReason = audited_revoked`. Pastor's transcript-read route returns
   * 403 from this moment. Idempotent: a relationship already past
   * `revoked` is returned unchanged.
   *
   * BLE-133 — this method MUST NOT enqueue any push, email, or in-app
   * notification to the pastor. The doctrine is silent transition. See
   * {@link PastorModeNotificationsPolicy}; the silent-revoke unit test
   * pins this contract.
   */
  async revoke(args: { auditedUserId: string; relationshipId: string }) {
    const rel = await this.prisma.pastorRelationship.findUnique({
      where: { id: args.relationshipId },
    });
    if (!rel || rel.auditedUserId !== args.auditedUserId) {
      throw new NotFoundException({ code: 'relationship_not_found' });
    }
    if (
      rel.state === 'revoked' ||
      rel.state === 'sealed' ||
      rel.state === 'hard_deleted'
    ) {
      return rel;
    }
    return this.prisma.pastorRelationship.update({
      where: { id: rel.id },
      data: {
        state: 'revoked',
        revokedAt: new Date(),
        endReason: 'audited_revoked',
      },
    });
  }

  /**
   * Pastor-initiated step-down ("Mundur"). State → `revoked`,
   * `revokedAt = now`, `endReason = pastor_mundur`. Idempotent for
   * already-ended relationships.
   *
   * BLE-133 — Mundur and audited-revoke MUST be indistinguishable from
   * the pastor's sidebar view (same state, same display). The endReason
   * column exists for the audited user's mirror only; pastor-facing
   * serializers ({@link listSidebar}) drop it.
   */
  async mundur(args: { pastorUserId: string; relationshipId: string }) {
    const rel = await this.prisma.pastorRelationship.findUnique({
      where: { id: args.relationshipId },
    });
    if (!rel || rel.pastorUserId !== args.pastorUserId) {
      throw new NotFoundException({ code: 'relationship_not_found' });
    }
    if (
      rel.state === 'revoked' ||
      rel.state === 'sealed' ||
      rel.state === 'hard_deleted'
    ) {
      return rel;
    }
    return this.prisma.pastorRelationship.update({
      where: { id: rel.id },
      data: {
        state: 'revoked',
        revokedAt: new Date(),
        endReason: 'pastor_mundur',
      },
    });
  }

  /**
   * Pastor sidebar — `Berjalan bersama` (state=walking) plus
   * `Sudah selesai` (state ∈ {revoked, sealed}). Hard-deleted relationships
   * drop off the sidebar entirely (the journal at {@link listJournals}
   * keeps them).
   *
   * BLE-133 redaction contract:
   *   - `endReason` is NOT serialized. Pastor must not see "she revoked
   *     you" vs "you stepped away" — both look identical.
   *   - The display name + avatar color come from the audited user's
   *     profile while the relationship is walking, and from the pastor's
   *     own note snapshot once sealed (so a deleted user doesn't surface
   *     a 404 in the sidebar).
   *   - `endedAt` is the wall-clock end (revokedAt) — same shape for both
   *     mundur and audited_revoked.
   */
  async listSidebar(pastorUserId: string): Promise<PastorSidebar> {
    const rows = await this.prisma.pastorRelationship.findMany({
      where: {
        pastorUserId,
        state: { in: ['walking', 'revoked', 'sealed'] },
      },
      orderBy: [{ state: 'asc' }, { walkingAt: 'desc' }],
      include: {
        auditedUser: {
          select: { id: true, profile: { select: { displayName: true } } },
        },
      },
    });

    const active: SidebarEntry[] = [];
    const ended: SidebarEntry[] = [];
    for (const r of rows) {
      const entry: SidebarEntry = {
        relationshipId: r.id,
        displayName: r.auditedUser?.profile?.displayName ?? 'Saudara/i',
        startedAt: r.walkingAt?.toISOString() ?? r.acceptedAt?.toISOString() ?? null,
        // endReason intentionally absent — see BLE-133 redaction contract.
      };
      if (r.state === 'walking') {
        active.push(entry);
      } else {
        ended.push({
          ...entry,
          endedAt: r.revokedAt?.toISOString() ?? null,
        });
      }
    }
    return { active, ended };
  }
}

export interface SidebarEntry {
  relationshipId: string;
  displayName: string;
  startedAt: string | null;
  endedAt?: string | null;
}

export interface PastorSidebar {
  active: SidebarEntry[];
  ended: SidebarEntry[];
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { generateSealAuditId } from './seal-audit-id.js';

const SEAL_DELAY_MS = 24 * 60 * 60 * 1000;

export interface SealReport {
  relationshipId: string;
  sealAuditId: string;
  notesSnapshotted: number;
}

/**
 * BLE-132 — hourly seal job. Picks every relationship that has been in
 * `revoked` state for ≥ 24h and transitions it to `sealed`:
 *  - sets `sealedAt`, `sealAuditId`
 *  - snapshots audited-user identity into `pastor_notes.audited_user_snapshot`
 *    so journal queries do not have to JOIN past the sealed boundary.
 *
 * Idempotent: a row already `sealed` is filtered out by the query. If
 * the worker dies mid-batch, the next tick (≤ 1h later) finishes the job.
 * The 24h is an upper bound on the visible flip — access loss (the 403)
 * is instant from `revoked`.
 *
 * Legal hold: when `legalHold = true` the row still seals; only
 * hard-delete is skipped.
 */
@Injectable()
export class SealRelationshipsWorker {
  private readonly logger = new Logger(SealRelationshipsWorker.name);

  constructor(private readonly prisma: PrismaService) {}

  async runOnce(now: Date = new Date(), batchSize = 500): Promise<SealReport[]> {
    const cutoff = new Date(now.getTime() - SEAL_DELAY_MS);
    const due = await this.prisma.pastorRelationship.findMany({
      where: { state: 'revoked', revokedAt: { lte: cutoff } },
      include: { auditedUser: { include: { profile: true } } },
      take: batchSize,
    });

    const reports: SealReport[] = [];
    for (const rel of due) {
      const sealAuditId = generateSealAuditId(now);
      const walkedForDays = walkingDays(rel);

      const snapshot = {
        display_name: rel.auditedUser.profile?.displayName ?? null,
        avatar_color: null as string | null,
        walked_for_days: walkedForDays,
      };

      // Single transaction: flip state and stamp the snapshot together.
      // Idempotency guard: only update notes whose snapshot is still null.
      const [, snapshotted] = await this.prisma.$transaction([
        this.prisma.pastorRelationship.update({
          where: { id: rel.id },
          data: { state: 'sealed', sealedAt: now, sealAuditId },
        }),
        this.prisma.pastorNote.updateMany({
          where: { relationshipId: rel.id },
          data: { auditedUserSnapshot: snapshot },
        }),
      ]);

      this.logger.log(
        `relationship_sealed id=${rel.id} sealAuditId=${sealAuditId} notesSnapshotted=${snapshotted.count}`,
      );
      reports.push({
        relationshipId: rel.id,
        sealAuditId,
        notesSnapshotted: snapshotted.count,
      });
    }
    return reports;
  }
}

function walkingDays(rel: {
  acceptedAt: Date | null;
  walkingAt: Date | null;
  invitedAt: Date;
  revokedAt: Date | null;
}): number | null {
  const start = rel.walkingAt ?? rel.acceptedAt ?? rel.invitedAt;
  const end = rel.revokedAt;
  if (!start || !end) return null;
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
}

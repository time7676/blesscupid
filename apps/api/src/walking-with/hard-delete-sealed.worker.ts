import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const HARD_DELETE_DELAY_MS = 90 * 24 * 60 * 60 * 1000;

export interface HardDeleteReport {
  relationshipId: string;
  transcriptsDeleted: number;
}

/**
 * BLE-132 — daily hard-delete job. After a relationship has been
 * `sealed` for ≥ 90 days and has no legal hold, transcript data is
 * permanently dropped and the row transitions to `hard_deleted`.
 *
 * Pastor's notes are NOT touched — they are pastor's own data and
 * survive both seal and hard-delete (only the audited-user snapshot
 * remains as their handle on Maya). The audited user's mirror lives in
 * a separate user-side schema and is never touched here.
 */
@Injectable()
export class HardDeleteSealedWorker {
  private readonly logger = new Logger(HardDeleteSealedWorker.name);

  constructor(private readonly prisma: PrismaService) {}

  async runOnce(now: Date = new Date(), batchSize = 100): Promise<HardDeleteReport[]> {
    const cutoff = new Date(now.getTime() - HARD_DELETE_DELAY_MS);
    const due = await this.prisma.pastorRelationship.findMany({
      where: {
        state: 'sealed',
        sealedAt: { lte: cutoff },
        legalHold: false,
      },
      take: batchSize,
    });

    const reports: HardDeleteReport[] = [];
    for (const rel of due) {
      const [deleted] = await this.prisma.$transaction([
        this.prisma.transcriptMessage.deleteMany({ where: { relationshipId: rel.id } }),
        this.prisma.pastorRelationship.update({
          where: { id: rel.id },
          data: { state: 'hard_deleted', hardDeletedAt: now },
        }),
      ]);

      this.logger.log(
        `relationship_hard_deleted id=${rel.id} sealAuditId=${rel.sealAuditId} transcriptsDeleted=${deleted.count}`,
      );
      reports.push({ relationshipId: rel.id, transcriptsDeleted: deleted.count });
    }
    return reports;
  }
}

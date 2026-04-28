import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AccountDeletionService } from './account-deletion.service.js';

/**
 * Optional S3 (or compatible object-store) port for purging photo blobs
 * when a user is hard-deleted. The worker functions without it — DB rows
 * are still purged, and storage keys are reported back to the caller so a
 * separate sweeper can reconcile.
 */
export interface ObjectStorePort {
  deleteObjects(storageKeys: string[]): Promise<void>;
}

export interface PurgeReport {
  userId: string;
  requestId: string;
  messagesTombstoned: number;
  messagesPreserved: number;
  photosDeleted: number;
  storageKeysFreed: string[];
  reportsAnonymized: number;
  blocksRemoved: number;
}

/**
 * BLE-10 — nightly worker that consumes
 * `AccountDeletionService.planHardDeletePass()` directives and purges PII
 * from the database while respecting active `EvidenceFreeze` rows.
 *
 * The User row is *anonymized*, not deleted, so frozen-thread Message
 * bodies (under FK Cascade with User) stay intact for moderator review.
 * After the freeze expires, a follow-up pass can finish the job.
 */
@Injectable()
export class HardDeleteWorker {
  private readonly logger = new Logger(HardDeleteWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly deletion: AccountDeletionService,
    private readonly objectStore?: ObjectStorePort,
  ) {}

  async runOnce(): Promise<PurgeReport[]> {
    const directives = await this.deletion.planHardDeletePass();
    const reports: PurgeReport[] = [];
    for (const d of directives) {
      const report = await this.purgeUser(d.userId, d.preservedThreadIds);
      await this.deletion.markHardDeleted(d.requestId);
      reports.push({ ...report, requestId: d.requestId });
      this.logger.log(
        `hard-deleted user=${d.userId} tombstoned=${report.messagesTombstoned} preserved=${report.messagesPreserved} photos=${report.photosDeleted}`,
      );
    }
    return reports;
  }

  private async purgeUser(
    userId: string,
    preservedThreadIds: string[],
  ): Promise<Omit<PurgeReport, 'requestId'>> {
    // Photos — collect storage keys before delete so the object-store hook can
    // free them.
    const photos = await this.prisma.photo.findMany({
      where: { userId },
      select: { id: true, storageKey: true },
    });
    const storageKeys = photos.map((p) => p.storageKey);

    // Tombstone non-frozen-thread messages where this user was sender or
    // recipient; preserve frozen-thread messages verbatim.
    const messageWhere: Record<string, unknown> = {
      OR: [{ senderUserId: userId }, { recipientUserId: userId }],
    };
    if (preservedThreadIds.length > 0) {
      messageWhere['threadId'] = { notIn: preservedThreadIds };
    }
    const tombstoneRes = await this.prisma.message.updateMany({
      where: messageWhere,
      data: { body: '[deleted]', attachmentIds: [] },
    });

    // Count preserved (frozen-thread) messages for the report.
    let messagesPreserved = 0;
    if (preservedThreadIds.length > 0) {
      messagesPreserved = await this.prisma.message.count({
        where: {
          OR: [{ senderUserId: userId }, { recipientUserId: userId }],
          threadId: { in: preservedThreadIds },
        },
      });
    }

    // Anonymize Reports authored by, or about, the user. Freeform text can
    // contain quoted content from the other party — clear it.
    const reportRes = await this.prisma.report.updateMany({
      where: { OR: [{ reporterUserId: userId }, { reportedUserId: userId }] },
      data: { freeform: null },
    });

    // Drop blocks involving this user. The other party gets a clean slate;
    // we err on the side of clearing rather than preserving block state from
    // a deleted account.
    const blockRes = await this.prisma.block.deleteMany({
      where: { OR: [{ blockerUserId: userId }, { blockedUserId: userId }] },
    });

    // Cascade-deletable PII tables — delete rows directly so the tombstoned
    // User row has no remaining personal data attached.
    await this.prisma.oAuthAccount.deleteMany({ where: { userId } });
    await this.prisma.session.deleteMany({ where: { userId } });
    await this.prisma.covenantSignature.deleteMany({ where: { userId } });
    await this.prisma.faithProfile.deleteMany({ where: { userId } });
    await this.prisma.profile.deleteMany({ where: { userId } });
    await this.prisma.photo.deleteMany({ where: { userId } });

    // Anonymize the User row itself. Email is replaced with a non-routable
    // tombstone keyed on the id so the unique constraint still holds. dob is
    // set to the unix epoch so age-related queries don't accidentally
    // include this user.
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@deleted.local`,
        passwordHash: null,
        dob: new Date('1970-01-01'),
        ageVerifiedAdult: false,
        emailVerified: false,
        isSuspended: true,
        deletedAt: new Date(),
      },
    });

    // Best-effort object-store purge.
    if (this.objectStore && storageKeys.length > 0) {
      try {
        await this.objectStore.deleteObjects(storageKeys);
      } catch (err) {
        this.logger.warn(
          `object-store purge failed for ${userId}: ${(err as Error).message}`,
        );
      }
    }

    return {
      userId,
      messagesTombstoned: tombstoneRes.count,
      messagesPreserved,
      photosDeleted: photos.length,
      storageKeysFreed: storageKeys,
      reportsAnonymized: reportRes.count,
      blocksRemoved: blockRes.count,
    };
  }
}

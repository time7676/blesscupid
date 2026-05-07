import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TokenService } from '../auth/token.service.js';

/**
 * BLE-10 / v1-restart — soft + hard delete on `User.deletedAt` only.
 *
 * Schema simplification: the legacy `AccountDeletionRequest` table is gone.
 * State now lives entirely on `User.deletedAt`:
 *
 *   deletedAt = null            → active account
 *   deletedAt set, < 30d ago    → soft-deleted, restorable
 *   deletedAt set, >= 30d ago   → due for hard delete (worker picks up)
 *
 * Hard delete = `prisma.user.delete()`; cascade fkey rules in schema.prisma
 * fan out the purge across Profile, Photo, Session, OAuthAccount,
 * MatchDecision, Match, Message, Block, Report, Notification, etc.
 */
export const HARD_DELETE_DAYS = 30;
const HARD_DELETE_MS = HARD_DELETE_DAYS * 86_400_000;

export interface SoftDeleteResult {
  ok: true;
  deletedAt: string;
  restoreDeadline: string;
}

@Injectable()
export class AccountDeletionService {
  private readonly logger = new Logger(AccountDeletionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  /**
   * Soft-delete: stamp `User.deletedAt` and revoke all live sessions.
   * Idempotent — returns the existing deletedAt if already soft-deleted.
   */
  async softDelete(userId: string): Promise<SoftDeleteResult> {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { deletedAt: true },
    });
    const now = existing?.deletedAt ?? new Date();

    if (!existing?.deletedAt) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { deletedAt: now },
      });
      await this.tokens.revokeAllForUser(userId);
    }

    return {
      ok: true,
      deletedAt: now.toISOString(),
      restoreDeadline: new Date(now.getTime() + HARD_DELETE_MS).toISOString(),
    };
  }

  /**
   * Restore a soft-deleted user — clears `deletedAt` if still inside the
   * 30-day window. Returns false if the account isn't soft-deleted or the
   * window has elapsed (caller turns that into 403).
   */
  async cancelDeletion(userId: string): Promise<boolean> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { deletedAt: true },
    });
    if (!u?.deletedAt) return false;
    const cutoff = Date.now() - HARD_DELETE_MS;
    if (u.deletedAt.getTime() < cutoff) return false;
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: null },
    });
    return true;
  }

  /**
   * Hard-delete a single user. Cascade in `schema.prisma` removes every
   * dependent row (Profile, Photo, Session, OAuth, Match, Message, etc).
   * Used by the hourly hard-delete worker.
   */
  async permanentlyDelete(userId: string): Promise<void> {
    await this.prisma.user.delete({ where: { id: userId } });
    this.logger.log(`hard-deleted user=${userId}`);
  }
}

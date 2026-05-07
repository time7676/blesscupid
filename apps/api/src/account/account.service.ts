import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Tradition, WalkStage, MarriageIntent } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { MatchingService } from '../matching/matching.service.js';
import {
  AccountDeletionService,
  type SoftDeleteResult,
} from './account-deletion.service.js';

export type PauseDuration = '1d' | '1w' | 'indefinite';

export interface ProfilePatch {
  displayName?: string;
  bio?: string;
  tradition?: Tradition;
  walkStage?: WalkStage;
  marriageIntent?: MarriageIntent;
  city?: string;
  homeChurchName?: string | null;
}

/** Profile fields that, when changed, must invalidate the matching deck cache. */
const MATCHING_FIELDS = new Set<keyof ProfilePatch>([
  'tradition',
  'walkStage',
  'marriageIntent',
  'city',
]);

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matching: MatchingService,
    private readonly deletion: AccountDeletionService,
  ) {}

  /** GET /v1/me — User + Profile + activity counts. */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        role: true,
        isSuspended: true,
        deletedAt: true,
        onboardingCompleted: true,
        timezone: true,
        localePreference: true,
        countryCode: true,
        emailVerifiedAt: true,
        lastActiveAt: true,
        createdAt: true,
        profile: true,
      },
    });
    if (!user) throw new NotFoundException({ code: 'user_not_found' });

    const [matchesCount, threadsCount, unreadNotifications] = await Promise.all([
      this.prisma.match.count({
        where: { OR: [{ userAId: userId }, { userBId: userId }] },
      }),
      this.prisma.thread.count({
        where: {
          match: { OR: [{ userAId: userId }, { userBId: userId }] },
        },
      }),
      this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
    ]);

    return {
      ...user,
      counts: {
        matches: matchesCount,
        threads: threadsCount,
        unreadNotifications,
      },
    };
  }

  /**
   * PATCH /v1/me/profile — partial update on Profile. If a matching-relevant
   * field changes, invalidates the matching deck cache for the user.
   */
  async updateProfile(userId: string, patch: ProfilePatch) {
    const data: Record<string, unknown> = {};
    let invalidates = false;
    for (const k of Object.keys(patch) as (keyof ProfilePatch)[]) {
      const v = patch[k];
      if (v === undefined) continue;
      data[k] = v;
      if (k === 'bio') {
        // bio re-edit goes back through moderation — clear approval stamp.
        data['bioApprovedAt'] = null;
      }
      if (MATCHING_FIELDS.has(k)) invalidates = true;
    }
    if (Object.keys(data).length === 0) {
      const profile = await this.prisma.profile.findUnique({ where: { userId } });
      if (!profile) throw new NotFoundException({ code: 'profile_not_found' });
      return { ok: true, profile };
    }

    const profile = await this.prisma.profile.update({
      where: { userId },
      data,
    });
    if (invalidates) {
      await this.matching.invalidateCache(userId);
    }
    return { ok: true, profile };
  }

  /** PATCH /v1/me/privacy — currently only `hideFromUnverified`. */
  async updatePrivacy(userId: string, patch: { hideFromUnverified?: boolean }) {
    if (patch.hideFromUnverified === undefined) return { ok: true };
    const profile = await this.prisma.profile.update({
      where: { userId },
      data: { hideFromUnverified: patch.hideFromUnverified },
      select: { hideFromUnverified: true },
    });
    return { ok: true, profile };
  }

  /** POST /v1/me/pause — sets Profile.pausedUntil. */
  async pauseProfile(userId: string, duration: PauseDuration) {
    const now = Date.now();
    let until: Date | null;
    if (duration === '1d') until = new Date(now + 86_400_000);
    else if (duration === '1w') until = new Date(now + 7 * 86_400_000);
    else {
      // 'indefinite' — far-future sentinel; UI surfaces "until you resume".
      until = new Date('9999-12-31T00:00:00Z');
    }
    await this.prisma.profile.update({
      where: { userId },
      data: { pausedUntil: until },
    });
    await this.matching.invalidateCache(userId);
    return { ok: true, pausedUntil: until.toISOString() };
  }

  /** DELETE /v1/me/pause — clear pause. */
  async unpauseProfile(userId: string) {
    await this.prisma.profile.update({
      where: { userId },
      data: { pausedUntil: null },
    });
    await this.matching.invalidateCache(userId);
    return { ok: true };
  }

  /** DELETE /v1/me — soft-delete. Revokes sessions. */
  softDelete(userId: string): Promise<SoftDeleteResult> {
    return this.deletion.softDelete(userId);
  }

  /** POST /v1/me/restore — clear deletedAt within 30d window or 403. */
  async restore(userId: string): Promise<{ ok: true }> {
    const ok = await this.deletion.cancelDeletion(userId);
    if (!ok) throw new ForbiddenException({ code: 'restore_window_expired' });
    return { ok: true };
  }

  /**
   * GET /v1/me/export — synchronous JSON dump per UU PDP Pasal 11.
   * v1 returns inline; v1.1 plan = async via signed email link.
   */
  async exportData(userId: string) {
    const [user, photos, decisions, sentMessages, matches] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          oauthAccounts: { select: { provider: true, createdAt: true } },
          covenantSignatures: true,
        },
      }),
      this.prisma.photo.findMany({
        where: { userId },
        select: {
          id: true,
          position: true,
          status: true,
          storageKey: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.matchDecision.findMany({
        where: { userId },
        select: {
          candidateUserId: true,
          decision: true,
          day: true,
          createdAt: true,
        },
      }),
      this.prisma.message.findMany({
        where: { senderUserId: userId },
        select: {
          id: true,
          threadId: true,
          body: true,
          kind: true,
          verseRef: true,
          status: true,
          createdAt: true,
        },
        take: 5000,
      }),
      this.prisma.match.findMany({
        where: { OR: [{ userAId: userId }, { userBId: userId }] },
        select: {
          id: true,
          userAId: true,
          userBId: true,
          createdAt: true,
        },
      }),
    ]);
    if (!user) throw new NotFoundException({ code: 'user_not_found' });
    return {
      exportedAt: new Date().toISOString(),
      uuPdpClause: 'Pasal 11 (right to data portability)',
      user,
      photos,
      matches,
      matchDecisions: decisions,
      sentMessages,
    };
  }
}

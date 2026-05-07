/**
 * MatchingService — v1-restart rebuild.
 *
 * Glues the pure-function engine in `services/matching/src/` to Prisma +
 * Redis. Responsibilities:
 *
 *   - getCandidates(userId, limit)   read DailyStack from Redis (`deck:{userId}` 6h TTL),
 *                                    cold-compute via this service if missing.
 *   - recordDecision(...)            transactional MatchDecision upsert + DailyQuota
 *                                    bump + mutual Match/Thread creation under
 *                                    SERIALIZABLE isolation.
 *   - undoDecision(...)              Bless+ swipe-back, 120s window.
 *   - getQuotaStatus(userId)         tier + usage snapshot.
 *   - invalidateCache(userId)        DEL deck:{userId} (called on Profile/Photo/
 *                                    Subscription change hooks).
 */

import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  bucketKm,
  eligibility,
  haversineKm,
  proximityHint,
  scoreBreakdown,
  type DistanceBucket,
  type ProximityHint,
  type ScoringInput,
  type Tradition,
  type WalkStage,
  type WhimsicalAnswers,
} from '@blesscupid/matching';
import type { DecisionKind, SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import {
  type CandidateCardDto,
  type CandidatePhotoDto,
} from './candidate-card.dto.js';

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------

const DECK_KEY = (userId: string) => `deck:${userId}`;
const DECK_TTL_SEC = 6 * 60 * 60; // 6h
const DECK_DEFAULT_SIZE = 30;

const ANTI_PARETO_VIEW_KEY = (candidateUserId: string, day: string) =>
  `candidate_views:${candidateUserId}:${day}`;
const ANTI_PARETO_VIEW_THRESHOLD = 50;
const ANTI_PARETO_PENALTY = -25;

const CITY_BUCKET_KM = 50;
const UNDO_WINDOW_SEC = 120;

const QUOTA_LIMITS: Record<
  SubscriptionTier,
  { decisions: number; supers: number }
> = {
  free: { decisions: 10, supers: 1 },
  blessplus: { decisions: 100, supers: 5 },
};

// Fallback anchor used when the verse service hasn't been wired with
// pickAvailable yet. Plan §"Verse pool composition" lands a 7-day-TTL
// pool; this is the offline floor.
const FALLBACK_ANCHOR = {
  verseRef: 'Ecclesiastes 4:9-10',
  verseText:
    'Two are better than one, because they have a good return for their labor.',
  attribution: 'NIV',
};

// ---------------------------------------------------------------------------

export interface QuotaStatus {
  tier: SubscriptionTier;
  decisionsLimit: number;
  decisionsUsed: number;
  supersLimit: number;
  supersUsed: number;
  resetAtIso: string;
}

export interface DecisionResult {
  ok: true;
  decision: DecisionKind;
  match: { matchId: string; threadId: string } | null;
  quotaRemaining: { decisions: number; supers: number };
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // -------------------------------------------------------------------------
  // Deck read path
  // -------------------------------------------------------------------------

  async getCandidates(userId: string, limit = DECK_DEFAULT_SIZE): Promise<CandidateCardDto[]> {
    const cached = await this.readDeck(userId);
    let candidateIds = cached;
    if (!candidateIds) {
      candidateIds = await this.computeAndCacheDeck(userId);
    }
    const sliced = candidateIds.slice(0, limit);
    return this.hydrateCards(userId, sliced);
  }

  async incomingLikes(userId: string, limit = 50): Promise<CandidateCardDto[]> {
    // Bless+ surface — list users who liked this viewer but viewer hasn't
    // decided on yet. Tier check is enforced at the controller layer.
    const rows = await this.prisma.matchDecision.findMany({
      where: {
        candidateUserId: userId,
        decision: { in: ['like', 'super_like'] },
        viewer: { deletedAt: null, isSuspended: false },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { userId: true },
    });
    if (rows.length === 0) return [];
    const reverseIds = rows.map((r) => r.userId);
    const alreadyDecided = await this.prisma.matchDecision.findMany({
      where: { userId, candidateUserId: { in: reverseIds } },
      select: { candidateUserId: true },
    });
    const decidedSet = new Set(alreadyDecided.map((d) => d.candidateUserId));
    const visible = reverseIds.filter((id) => !decidedSet.has(id));
    return this.hydrateCards(userId, visible);
  }

  // -------------------------------------------------------------------------
  // Decision write path
  // -------------------------------------------------------------------------

  /**
   * Records a viewer's swipe on a candidate. Wraps the entire write set in
   * a SERIALIZABLE transaction so a simultaneous mutual-like race resolves
   * to a single Match row.
   */
  async recordDecision(args: {
    userId: string;
    candidateUserId: string;
    decision: DecisionKind;
  }): Promise<DecisionResult> {
    const { userId, candidateUserId, decision } = args;
    if (userId === candidateUserId) {
      throw new ForbiddenException({ code: 'self_decision' });
    }
    const day = todayKey();
    const tier = await this.getTier(userId);
    const limits = QUOTA_LIMITS[tier];

    const result = await this.prisma.$transaction(
      async (tx) => {
        // 1. Upsert MatchDecision (unique on [userId, candidateUserId]).
        await tx.matchDecision.upsert({
          where: {
            userId_candidateUserId: { userId, candidateUserId },
          },
          create: { userId, candidateUserId, decision, day },
          update: { decision, day },
        });

        // 2. Bump DailyQuota.
        const quota = await tx.dailyQuota.upsert({
          where: { userId_day: { userId, day } },
          create: {
            userId,
            day,
            likesUsed: decision === 'like' ? 1 : 0,
            supersUsed: decision === 'super_like' ? 1 : 0,
          },
          update: {
            likesUsed: {
              increment: decision === 'like' ? 1 : 0,
            },
            supersUsed: {
              increment: decision === 'super_like' ? 1 : 0,
            },
          },
        });

        // 3. Quota gate (after upsert so the bumped count is the canonical truth).
        if (decision === 'like' && quota.likesUsed > limits.decisions) {
          throw new ForbiddenException({
            code: 'quota_decisions_exhausted',
            tier,
            limit: limits.decisions,
          });
        }
        if (decision === 'super_like' && quota.supersUsed > limits.supers) {
          throw new ForbiddenException({
            code: 'quota_supers_exhausted',
            tier,
            limit: limits.supers,
          });
        }

        // 4. If pass: nothing else.
        if (decision === 'pass') {
          return {
            match: null as { matchId: string; threadId: string } | null,
            quota,
          };
        }

        // 4.5. Alpha-launch reviewer auto-match: when ALPHA_AUTO_LIKE=1 and
        // the candidate is a reviewer-decoy account, write the reverse
        // MatchDecision so step 5 sees a mutual interest. Triggers full
        // Match + Thread + ThreadAnchor + Notification creation in this
        // same transaction. Disable in production by unsetting env var.
        if (process.env.ALPHA_AUTO_LIKE === '1') {
          const candidate = await tx.user.findUnique({
            where: { id: candidateUserId },
            select: { email: true },
          });
          if (
            candidate &&
            candidate.email.startsWith('reviewer-') &&
            candidate.email.endsWith('@seed.blesscupid.test')
          ) {
            await tx.matchDecision.upsert({
              where: {
                userId_candidateUserId: {
                  userId: candidateUserId,
                  candidateUserId: userId,
                },
              },
              create: {
                userId: candidateUserId,
                candidateUserId: userId,
                decision: 'like',
                day,
              },
              update: {},
            });
          }
        }

        // 5. Mutual check.
        const reverse = await tx.matchDecision.findUnique({
          where: {
            userId_candidateUserId: {
              userId: candidateUserId,
              candidateUserId: userId,
            },
          },
          select: { decision: true },
        });
        if (!reverse || reverse.decision === 'pass') {
          return { match: null, quota };
        }

        // 6. Create Match (idempotent on canonical sorted pair).
        const [aId, bId] = sortPair(userId, candidateUserId);
        const match = await tx.match.upsert({
          where: { userAId_userBId: { userAId: aId, userBId: bId } },
          create: { userAId: aId, userBId: bId },
          update: {},
        });

        // 7. Create Thread (one per match — schema enforces matchId unique).
        const existingThread = await tx.thread.findUnique({
          where: { matchId: match.id },
          select: { id: true },
        });
        let threadId: string;
        if (existingThread) {
          threadId = existingThread.id;
        } else {
          const thread = await tx.thread.create({
            data: { matchId: match.id },
            select: { id: true },
          });
          threadId = thread.id;
          // 8. Anchor verse (one per thread — TODO wire verse.service.pickAvailable).
          await tx.threadAnchor.create({
            data: {
              threadId,
              verseRef: FALLBACK_ANCHOR.verseRef,
              verseText: FALLBACK_ANCHOR.verseText,
              attribution: FALLBACK_ANCHOR.attribution,
            },
          });
        }

        // 9. Notifications, one per side.
        await tx.notification.createMany({
          data: [
            {
              userId: aId,
              kind: 'match',
              title: 'New match',
              body: 'You were both moved to bless each other.',
              payload: { deepLink: `thread:${threadId}`, threadId, matchId: match.id },
            },
            {
              userId: bId,
              kind: 'match',
              title: 'New match',
              body: 'You were both moved to bless each other.',
              payload: { deepLink: `thread:${threadId}`, threadId, matchId: match.id },
            },
          ],
        });

        return { match: { matchId: match.id, threadId }, quota };
      },
      { isolationLevel: 'Serializable' },
    );

    // Outside-tx side effects.
    if (result.match) {
      await this.enqueuePushFanout(userId, candidateUserId, result.match.threadId);
    }
    // Invalidate viewer's deck so the swiped candidate doesn't reappear.
    await this.invalidateCache(userId);

    const remainingDecisions = Math.max(
      0,
      limits.decisions - result.quota.likesUsed,
    );
    const remainingSupers = Math.max(0, limits.supers - result.quota.supersUsed);

    return {
      ok: true,
      decision,
      match: result.match,
      quotaRemaining: { decisions: remainingDecisions, supers: remainingSupers },
    };
  }

  /**
   * Bless+ swipe-back. Removes the most recent decision for this pair if
   *   - tier === blessplus
   *   - decision was created within the last 120s
   *   - the reverse mutual-Match (if any) hasn't been seen by the other side
   *     yet (heuristic: created within the same 120s).
   */
  async undoDecision(userId: string, candidateUserId: string): Promise<{ restored: true }> {
    const tier = await this.getTier(userId);
    if (tier !== 'blessplus') {
      throw new ForbiddenException({ code: 'undo_requires_blessplus' });
    }

    const decision = await this.prisma.matchDecision.findUnique({
      where: { userId_candidateUserId: { userId, candidateUserId } },
    });
    if (!decision) throw new NotFoundException({ code: 'decision_not_found' });

    const ageMs = Date.now() - decision.createdAt.getTime();
    if (ageMs > UNDO_WINDOW_SEC * 1000) {
      throw new ForbiddenException({ code: 'undo_window_expired' });
    }

    const day = decision.day;

    await this.prisma.$transaction(
      async (tx) => {
        await tx.matchDecision.delete({
          where: { userId_candidateUserId: { userId, candidateUserId } },
        });

        // Roll back the quota counter.
        await tx.dailyQuota.update({
          where: { userId_day: { userId, day } },
          data: {
            likesUsed: {
              decrement: decision.decision === 'like' ? 1 : 0,
            },
            supersUsed: {
              decrement: decision.decision === 'super_like' ? 1 : 0,
            },
          },
        });

        // Clean up the Match if (a) it exists and (b) was created from this
        // decision (heuristic: createdAt within the undo window). The
        // reverse decision stays — they liked, we no-longer-liked.
        if (decision.decision !== 'pass') {
          const [aId, bId] = sortPair(userId, candidateUserId);
          const match = await tx.match.findUnique({
            where: { userAId_userBId: { userAId: aId, userBId: bId } },
            include: { thread: { include: { anchor: true } } },
          });
          if (match && Date.now() - match.createdAt.getTime() <= UNDO_WINDOW_SEC * 1000) {
            // Cascade: thread + anchor cascade via Prisma onDelete.
            await tx.match.delete({ where: { id: match.id } });
            // Cancel pending match notifications (best-effort — kind=match
            // payload references threadId/matchId).
            if (match.thread) {
              await tx.notification.deleteMany({
                where: {
                  kind: 'match',
                  OR: [{ userId: aId }, { userId: bId }],
                  payload: {
                    path: ['threadId'],
                    equals: match.thread.id,
                  },
                },
              });
            }
          }
        }
      },
      { isolationLevel: 'Serializable' },
    );

    await this.invalidateCache(userId);
    return { restored: true };
  }

  // -------------------------------------------------------------------------
  // Quota
  // -------------------------------------------------------------------------

  async getQuotaStatus(userId: string): Promise<QuotaStatus> {
    const tier = await this.getTier(userId);
    const limits = QUOTA_LIMITS[tier];
    const day = todayKey();
    const quota = await this.prisma.dailyQuota.findUnique({
      where: { userId_day: { userId, day } },
    });
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return {
      tier,
      decisionsLimit: limits.decisions,
      decisionsUsed: quota?.likesUsed ?? 0,
      supersLimit: limits.supers,
      supersUsed: quota?.supersUsed ?? 0,
      resetAtIso: tomorrow.toISOString(),
    };
  }

  async getTier(userId: string): Promise<SubscriptionTier> {
    const sub = await this.prisma.userSubscription.findUnique({
      where: { userId },
      select: { tier: true, status: true },
    });
    if (!sub) return 'free';
    if (sub.status === 'cancelled' || sub.status === 'expired') return 'free';
    return sub.tier;
  }

  // -------------------------------------------------------------------------
  // Cache hooks
  // -------------------------------------------------------------------------

  /**
   * Wipes the cached deck. Called on Profile.update, Photo.approve,
   * isVerified.change, preferences.update, subscription.tier.change.
   * Public — other modules import MatchingService and call this.
   */
  async invalidateCache(userId: string): Promise<void> {
    await this.redis.getClient().del(DECK_KEY(userId));
  }

  // -------------------------------------------------------------------------
  // Internal: deck compute + hydrate
  // -------------------------------------------------------------------------

  private async readDeck(userId: string): Promise<string[] | null> {
    const raw = await this.redis.getClient().get(DECK_KEY(userId));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as string[];
      if (!Array.isArray(parsed)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  private async writeDeck(userId: string, ids: string[]): Promise<void> {
    await this.redis
      .getClient()
      .set(DECK_KEY(userId), JSON.stringify(ids), 'EX', DECK_TTL_SEC);
  }

  /**
   * Compute the top-N deck for `userId`, applying anti-Pareto exposure cap,
   * and persist it to Redis. Returns ordered candidate IDs.
   *
   * Public — invoked by `daily-stack.processor.ts` (cron) and lazily on
   * cache miss.
   */
  async computeAndCacheDeck(userId: string, size = DECK_DEFAULT_SIZE): Promise<string[]> {
    const viewer = await this.loadScoringInput(userId);
    if (!viewer) throw new NotFoundException({ code: 'viewer_not_found' });

    const pool = await this.loadCityBucketPool(viewer);
    const exclusions = await this.loadExclusions(userId);
    const day = todayKey();
    const redis = this.redis.getClient();

    // Score eligible candidates with anti-Pareto penalty.
    const scored: Array<{ id: string; score: number }> = [];
    for (const candidate of pool) {
      if (exclusions.has(candidate.userId)) continue;
      if (!eligibility(viewer, candidate)) continue;
      let total = scoreBreakdown(viewer, candidate).total;
      const viewCount = await redis.scard(
        ANTI_PARETO_VIEW_KEY(candidate.userId, day),
      );
      if (viewCount > ANTI_PARETO_VIEW_THRESHOLD) {
        total += ANTI_PARETO_PENALTY;
      }
      scored.push({ id: candidate.userId, score: total });
    }

    scored.sort((a, b) => b.score - a.score);
    const ids = scored.slice(0, size).map((s) => s.id);
    await this.writeDeck(userId, ids);

    // Tag exposure for anti-Pareto bookkeeping (1-day TTL).
    const pipeline = redis.pipeline();
    for (const id of ids) {
      const key = ANTI_PARETO_VIEW_KEY(id, day);
      pipeline.sadd(key, userId);
      pipeline.expire(key, 60 * 60 * 26);
    }
    await pipeline.exec();
    return ids;
  }

  // -------------------------------------------------------------------------
  // Internal: candidate / pool loaders
  // -------------------------------------------------------------------------

  private async loadScoringInput(userId: string): Promise<ScoringInput | null> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!u || !u.profile) return null;
    const age = ageFromDob(u.dob);
    return {
      userId: u.id,
      age,
      gender: u.profile.gender,
      seeking: u.profile.seeking,
      lat: u.profile.lat,
      lng: u.profile.lng,
      city: u.profile.city,
      homeChurchName: u.profile.homeChurchName,
      churchLat: u.profile.churchLat,
      churchLng: u.profile.churchLng,
      tradition: u.profile.tradition as Tradition,
      walkStage: u.profile.walkStage as WalkStage,
      marriageIntent: u.profile.marriageIntent,
      whimsicalAnswers: (u.profile.whimsicalAnswers as WhimsicalAnswers | null) ?? null,
      isVerified: u.profile.isVerified,
      hideFromUnverified: u.profile.hideFromUnverified,
      lastActiveAt: u.profile.updatedAt,
      ageVerifiedAdult: u.ageVerifiedAdult,
      isSuspended: u.isSuspended,
      isDeleted: u.deletedAt !== null,
      onboardingCompleted: u.onboardingCompleted,
    };
  }

  /**
   * City-bucket pre-filter — only score candidates inside a 50km Haversine
   * window of the viewer. Cheap O(N) loop in JS for v1; migrate to
   * Postgres earthdistance + KNN once active users > 2k (plan §"Daily-stack
   * precompute fairness").
   */
  private async loadCityBucketPool(viewer: ScoringInput): Promise<ScoringInput[]> {
    const rows = await this.prisma.user.findMany({
      where: {
        id: { not: viewer.userId },
        onboardingCompleted: true,
        isSuspended: false,
        deletedAt: null,
        profile: {
          is: {
            gender: viewer.seeking,
            seeking: viewer.gender,
          },
        },
      },
      include: { profile: true },
    });
    const out: ScoringInput[] = [];
    for (const u of rows) {
      if (!u.profile) continue;
      const km = haversineKm(viewer.lat, viewer.lng, u.profile.lat, u.profile.lng);
      if (km > CITY_BUCKET_KM) continue;
      out.push({
        userId: u.id,
        age: ageFromDob(u.dob),
        gender: u.profile.gender,
        seeking: u.profile.seeking,
        lat: u.profile.lat,
        lng: u.profile.lng,
        city: u.profile.city,
        homeChurchName: u.profile.homeChurchName,
        churchLat: u.profile.churchLat,
        churchLng: u.profile.churchLng,
        tradition: u.profile.tradition as Tradition,
        walkStage: u.profile.walkStage as WalkStage,
        marriageIntent: u.profile.marriageIntent,
        whimsicalAnswers:
          (u.profile.whimsicalAnswers as WhimsicalAnswers | null) ?? null,
        isVerified: u.profile.isVerified,
        hideFromUnverified: u.profile.hideFromUnverified,
        lastActiveAt: u.profile.updatedAt,
        ageVerifiedAdult: u.ageVerifiedAdult,
        isSuspended: u.isSuspended,
        isDeleted: u.deletedAt !== null,
        onboardingCompleted: u.onboardingCompleted,
      });
    }
    return out;
  }

  private async loadExclusions(userId: string): Promise<Set<string>> {
    const [decisions, blocks] = await Promise.all([
      this.prisma.matchDecision.findMany({
        where: { userId },
        select: { candidateUserId: true },
      }),
      this.prisma.block.findMany({
        where: { OR: [{ blockerUserId: userId }, { blockedUserId: userId }] },
        select: { blockerUserId: true, blockedUserId: true },
      }),
    ]);
    const set = new Set<string>();
    for (const d of decisions) set.add(d.candidateUserId);
    for (const b of blocks) {
      set.add(b.blockerUserId === userId ? b.blockedUserId : b.blockerUserId);
    }
    return set;
  }

  // -------------------------------------------------------------------------
  // Hydration → privacy-safe DTOs
  // -------------------------------------------------------------------------

  private async hydrateCards(
    viewerId: string,
    candidateIds: readonly string[],
  ): Promise<CandidateCardDto[]> {
    if (candidateIds.length === 0) return [];

    const viewer = await this.loadScoringInput(viewerId);
    if (!viewer) return [];

    const rows = await this.prisma.user.findMany({
      where: { id: { in: [...candidateIds] }, deletedAt: null, isSuspended: false },
      include: {
        profile: true,
        photos: { where: { status: 'approved' }, orderBy: { position: 'asc' } },
      },
    });
    const byId = new Map(rows.map((r) => [r.id, r]));

    // Determine which candidates are post-match-revealed (Match exists +
    // both verified). Single batch query keeps this O(1) round-trips.
    const pairs = candidateIds.map((id) => sortPair(viewerId, id));
    const matches = await this.prisma.match.findMany({
      where: {
        OR: pairs.map(([a, b]) => ({ userAId: a, userBId: b })),
      },
      select: { userAId: true, userBId: true },
    });
    const matchedSet = new Set(
      matches.map((m) => [m.userAId, m.userBId].sort().join('|')),
    );

    // Status verses (one per user — schema enforces userId @id).
    const now = new Date();
    const statusRows = await this.prisma.statusVerse.findMany({
      where: {
        userId: { in: [...candidateIds] },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });
    const statusByUser = new Map<string, (typeof statusRows)[number]>();
    for (const s of statusRows) statusByUser.set(s.userId, s);

    return candidateIds
      .map((id) => byId.get(id))
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .map((row): CandidateCardDto | null => {
        const p = row.profile;
        if (!p) return null;
        const km = haversineKm(viewer.lat, viewer.lng, p.lat, p.lng);
        const distanceBucket: DistanceBucket = bucketKm(km);
        const hint: ProximityHint = proximityHint(
          viewer.lat,
          viewer.lng,
          viewer.city,
          p.lat,
          p.lng,
          p.city,
        );
        const photos: CandidatePhotoDto[] = row.photos.map((ph) => ({
          // Storage key surfaces here; photos module resolves to signed URL.
          url: ph.storageKey,
          position: ph.position,
        }));
        const pairKey = sortPair(viewerId, row.id).join('|');
        const isMatched = matchedSet.has(pairKey);
        const reveal = isMatched && viewer.isVerified && p.isVerified;
        const status = statusByUser.get(row.id);
        const card: CandidateCardDto = {
          id: row.id,
          displayName: p.displayName,
          age: ageFromDob(row.dob),
          photos,
          city: p.city,
          distanceBucket,
          proximityHint: hint,
          tradition: p.tradition as Tradition,
          walkStage: p.walkStage as WalkStage,
          isVerified: p.isVerified,
          whimsicalAnswers: (p.whimsicalAnswers as WhimsicalAnswers) ?? {},
          bio: p.bioApprovedAt ? p.bio : null,
        };
        if (status) {
          card.statusVerse = {
            verseRef: status.verseRef,
            verseText: status.verseText,
          };
        }
        if (reveal && p.homeChurchName) {
          card.revealedHomeChurchName = p.homeChurchName;
        }
        return card;
      })
      .filter((c): c is CandidateCardDto => c !== null);
  }

  // -------------------------------------------------------------------------
  // Internal: push-fanout enqueue (best-effort, fails open)
  // -------------------------------------------------------------------------

  private async enqueuePushFanout(
    aId: string,
    bId: string,
    threadId: string,
  ): Promise<void> {
    // BullMQ wiring lives in notifications/push-fanout.processor.ts. For
    // this dispatch we publish a Redis list message; the existing
    // notifications module picks it up. If the queue isn't configured we
    // log and continue — the in-app Notification row already landed.
    try {
      await this.redis.getClient().lpush(
        'push-fanout',
        JSON.stringify({ kind: 'match', threadId, userIds: [aId, bId] }),
      );
    } catch (err) {
      this.logger.warn(
        `push-fanout enqueue failed: ${(err as Error).message}`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function ageFromDob(dob: Date): number {
  const ms = Date.now() - dob.getTime();
  return Math.floor(ms / (365.2422 * 24 * 60 * 60 * 1000));
}

/** Canonical lex sort of a uuid pair. */
function sortPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

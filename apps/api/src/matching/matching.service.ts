/**
 * MatchingService — wires Prisma rows to the pure faith-score engine in
 * `services/matching` and persists daily stacks.
 *
 * Lane B per BLE eng-review 2026-05-06.
 *
 * Pool strategy v1 (Bali single-city cohort, ~40 users):
 *   - Only users with onboardingCompleted=true, no soft delete, no
 *     suspension, with a Profile + FaithProfile row.
 *   - All users mapped to a single hard-coded `(-8.65, 115.22)` Denpasar
 *     coordinate so the geo axis returns ~0 distance and the scoring
 *     reduces to (denomination, marriageIntent, age, attendance, gifts).
 *   - When the cohort grows past one city in v1.1, swap this for a city
 *     name → coordinate lookup.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import {
  buildDailyStack,
  dayKey,
  type CandidateProfile,
  type Denomination,
  type ChurchAttendance,
  type MarriageIntent,
  type SpiritualGift,
} from '@blesscupid/matching';
import { PrismaService } from '../prisma/prisma.service.js';

// Bali single-city anchor. v1 scope per /plan-eng-review 2026-05-06.
const DEFAULT_COORDS = { lat: -8.65, lng: 115.22 };
const DEFAULT_MAX_DISTANCE_KM = 250;
// Wide age preference fallback for users who didn't pick one. Real age
// preference UI lands in v1.1; for v1 we use a tolerant default so the
// matching pool isn't artificially small.
const DEFAULT_AGE_PREF = { minAge: 18, maxAge: 55 };

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns today's daily stack for the viewer. Computes + persists if
   * missing, idempotent within a UTC day (DailyStack has a unique
   * constraint on (userId, day)).
   */
  async getOrComputeStack(viewerId: string) {
    const day = dayKey();

    const existing = await this.prisma.dailyStack.findUnique({
      where: { userId_day: { userId: viewerId, day } },
    });
    if (existing) {
      // Mark seen on first read each day (used for D2 retention reporting).
      if (!existing.seenAt) {
        await this.prisma.dailyStack.update({
          where: { id: existing.id },
          data: { seenAt: new Date() },
        });
      }
      return this.hydrateStack(existing.candidateUserIds, viewerId);
    }

    const stack = await this.computeStack(viewerId, day);
    return this.hydrateStack(stack, viewerId);
  }

  /**
   * Compute and persist a stack for one user. Used by both on-demand
   * (first GET /matches/today of the day) and by the nightly cron.
   * Returns the candidate user IDs in score order.
   */
  async computeStack(viewerId: string, day: string): Promise<string[]> {
    const viewer = await this.loadCandidate(viewerId);
    if (!viewer) throw new NotFoundException('viewer_not_found');

    const pool = await this.loadPool(viewerId);
    const excluded = await this.loadExcludedIds(viewerId);

    // BLE 2026-05-06 — quota model. Stack size 50 (engine's STACK_MAX)
    // covers free-tier 10 decisions/day with comfortable runway plus
    // light-tier 50 cap exactly. Heavier tiers (open 150 / deep
    // unlimited) re-fetch via the supply-replenish job (TODO v1.1) when
    // they exhaust the seeded stack mid-day. For v1 launch this single
    // batch is enough: even a deep-tier user rarely makes 50 decisions
    // before the next day's recompute.
    const scored = buildDailyStack(viewer, pool, {
      day,
      excludeUserIds: excluded,
      size: 50,
    });

    const candidateIds = scored.map((s) => s.candidateUserId);

    await this.prisma.dailyStack.upsert({
      where: { userId_day: { userId: viewerId, day } },
      create: {
        userId: viewerId,
        day,
        candidateUserIds: candidateIds,
      },
      update: {
        candidateUserIds: candidateIds,
      },
    });

    return candidateIds;
  }

  /**
   * Records a viewer's decision on one candidate. `pass` is silent.
   * `like` triggers a Begin intent (verse-anchor enforcement at chat
   * boundary, see chat module). `favorite` is the scarce 1/day priority
   * signal — the controller enforces the 1/day cap before calling here.
   *
   * Alpha-launch reviewer auto-match: when ALPHA_AUTO_LIKE=1 and the
   * candidate is a reviewer-decoy account (email starts with `reviewer-`
   * @ seed.blesscupid.test), this method also writes the reverse
   * MatchDecision so chat unlocks immediately. Reviewers are passive
   * (no real human reply) but the match + thread create work end-to-end.
   * Disable: unset ALPHA_AUTO_LIKE in container env.
   */
  async recordDecision(
    viewerId: string,
    candidateUserId: string,
    decision: 'pass' | 'like' | 'favorite',
  ) {
    const day = dayKey();
    await this.prisma.matchDecision.upsert({
      where: {
        userId_candidateUserId: { userId: viewerId, candidateUserId },
      },
      create: { userId: viewerId, candidateUserId, decision, day },
      update: { decision, day },
    });

    if (
      (decision === 'like' || decision === 'favorite') &&
      process.env.ALPHA_AUTO_LIKE === '1'
    ) {
      await this.maybeAutoLikeReviewer(viewerId, candidateUserId, day);
    }

    // Mutual-match detection: if BOTH directions are like/favorite, this is
    // a match. Mobile listens for `match: true` to fire the MatchSheet
    // ceremony. `pass` decisions never produce a match.
    let match = false;
    if (decision === 'like' || decision === 'favorite') {
      const reverse = await this.prisma.matchDecision.findUnique({
        where: {
          userId_candidateUserId: {
            userId: candidateUserId,
            candidateUserId: viewerId,
          },
        },
        select: { decision: true },
      });
      match =
        reverse !== null &&
        (reverse.decision === 'like' || reverse.decision === 'favorite');
    }

    return { ok: true, decision, day, match };
  }

  /**
   * If `candidateUserId` belongs to a reviewer-decoy account, write the
   * reverse MatchDecision (reviewer → viewer = 'like'). Idempotent via
   * unique constraint on (userId, candidateUserId).
   */
  private async maybeAutoLikeReviewer(
    viewerId: string,
    candidateUserId: string,
    day: string,
  ): Promise<void> {
    const candidate = await this.prisma.user.findUnique({
      where: { id: candidateUserId },
      select: { email: true },
    });
    if (!candidate) return;
    if (!candidate.email.startsWith('reviewer-')) return;
    if (!candidate.email.endsWith('@seed.blesscupid.test')) return;

    await this.prisma.matchDecision.upsert({
      where: {
        userId_candidateUserId: {
          userId: candidateUserId,
          candidateUserId: viewerId,
        },
      },
      create: {
        userId: candidateUserId,
        candidateUserId: viewerId,
        decision: 'like',
        day,
      },
      update: {},
    });
  }

  /** True when the viewer has spent their 1/day favorite on `day`. */
  async hasFavoritedToday(viewerId: string): Promise<boolean> {
    const today = dayKey();
    const fav = await this.prisma.matchDecision.findFirst({
      where: { userId: viewerId, day: today, decision: 'favorite' },
      select: { id: true },
    });
    return Boolean(fav);
  }

  /**
   * Hydrate persisted candidate IDs back into displayable rows. Strips
   * PII (legalName, email, phone, exactCoordinates) — only displayName,
   * age, city, faith summary, photoUrl surface to the viewer.
   */
  private async hydrateStack(
    candidateIds: readonly string[],
    viewerId: string,
  ) {
    if (candidateIds.length === 0) return [];
    const rows = await this.prisma.user.findMany({
      where: { id: { in: [...candidateIds] }, deletedAt: null, isSuspended: false },
      include: {
        profile: true,
        photos: {
          where: { status: 'approved' },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });
    // Preserve the score-order of candidateIds.
    const byId = new Map(rows.map((r) => [r.id, r]));
    void viewerId; // reserved for future personalization (mutual flag).
    return candidateIds
      .map((id) => byId.get(id))
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .map((row) => ({
        userId: row.id,
        displayName: row.profile?.displayName ?? '',
        age: this.ageFromDob(row.dob),
        city: row.profile?.city ?? '',
        tradition: row.profile?.tradition ?? null,
        walkStage: row.profile?.walkStage ?? null,
        bio: row.profile?.bioApproved ? row.profile.bio : null,
        // Photo storage key gets resolved into a signed CDN URL by the
        // photos module on /v1/photos/:id/url; clients fetch the URL
        // separately. Returning the storage key here (not the full URL)
        // keeps this endpoint cheap and lets photo expiry rotate without
        // changing match data.
        photoStorageKey: row.photos[0]?.storageKey ?? null,
      }));
  }

  private ageFromDob(dob: Date): number {
    const ms = Date.now() - dob.getTime();
    return Math.floor(ms / (365.2422 * 24 * 60 * 60 * 1000));
  }

  /**
   * Load one user as a CandidateProfile for the matching engine. Returns
   * null when the user isn't fully onboarded (FaithProfile + Profile both
   * required). The pure scoring code expects every field populated.
   */
  private async loadCandidate(userId: string): Promise<CandidateProfile | null> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        faithProfile: true,
        photos: {
          where: { status: 'approved' },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });
    if (!u || !u.profile || !u.faithProfile) return null;
    if (u.deletedAt || u.isSuspended) return null;

    return {
      userId: u.id,
      displayName: u.profile.displayName,
      age: this.ageFromDob(u.dob),
      gender: u.profile.gender as 'male' | 'female',
      seekingGender: this.seekingGenderFor(u.profile.gender),
      location: DEFAULT_COORDS,
      maxDistanceKm: DEFAULT_MAX_DISTANCE_KM,
      agePreference: DEFAULT_AGE_PREF,
      faith: {
        denomination: u.faithProfile.denomination as Denomination,
        churchAttendance: u.faithProfile.churchAttendance as ChurchAttendance,
        baptized: u.faithProfile.baptized,
        marriageIntent: u.faithProfile.marriageIntent as MarriageIntent,
        spiritualGifts: u.faithProfile.spiritualGifts as SpiritualGift[],
      },
      // Photos store an opaque storageKey (R2 object key); the matching
      // engine only checks photoUrl for null/non-null, never reads the
      // string value. We pass the storageKey verbatim. The hydrate path
      // surfaces it under `photoStorageKey` and the photos module is
      // responsible for resolving keys to signed CDN URLs.
      photoUrl: u.photos[0]?.storageKey ?? null,
      bioApproved: u.profile.bioApproved,
      photoApproved: u.photos.length > 0,
      covenantSigned: true, // covenant gate is enforced upstream in onboarding
      ageVerifiedAdult: u.ageVerifiedAdult,
      bannedOrSuspended: u.isSuspended,
      email: u.email,
    };
  }

  /**
   * v1 simplification: assume opposite-gender seeking. Same-sex preferences
   * are out-of-scope at v1 per the Holy Code §4.2 redirect flow already
   * shipped in onboarding (Q3RedirectEvent). Friendship-only users land
   * outside the dating pool entirely.
   */
  private seekingGenderFor(g: 'male' | 'female'): 'male' | 'female' {
    return g === 'male' ? 'female' : 'male';
  }

  private async loadPool(viewerId: string): Promise<CandidateProfile[]> {
    const userIds = await this.prisma.user.findMany({
      where: {
        id: { not: viewerId },
        onboardingCompleted: true,
        isSuspended: false,
        deletedAt: null,
        profile: { isNot: null },
        faithProfile: { isNot: null },
      },
      select: { id: true },
    });
    const candidates = await Promise.all(
      userIds.map((u) => this.loadCandidate(u.id)),
    );
    return candidates.filter((c): c is CandidateProfile => c !== null);
  }

  /**
   * Exclusion set: anyone the viewer already passed/liked/favorited on
   * any previous day, plus anyone they blocked or who blocked them.
   * Keeps the daily stack fresh.
   */
  private async loadExcludedIds(viewerId: string): Promise<Set<string>> {
    const [decisions, blocks] = await Promise.all([
      this.prisma.matchDecision.findMany({
        where: { userId: viewerId },
        select: { candidateUserId: true },
      }),
      this.prisma.block.findMany({
        where: {
          OR: [{ blockerUserId: viewerId }, { blockedUserId: viewerId }],
        },
        select: { blockerUserId: true, blockedUserId: true },
      }),
    ]);
    const set = new Set<string>();
    decisions.forEach((d) => set.add(d.candidateUserId));
    blocks.forEach((b) => {
      set.add(b.blockerUserId === viewerId ? b.blockedUserId : b.blockerUserId);
    });
    return set;
  }
}

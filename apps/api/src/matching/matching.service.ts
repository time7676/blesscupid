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

    const scored = buildDailyStack(viewer, pool, {
      day,
      excludeUserIds: excluded,
      // v1 = 3 introductions per day. The matching engine's STACK_MIN is 10
      // for clamp safety; we trim after at the persistence layer so the
      // viewer always sees exactly 3.
      size: 10,
    });

    const top3 = scored.slice(0, 3).map((s) => s.candidateUserId);

    await this.prisma.dailyStack.upsert({
      where: { userId_day: { userId: viewerId, day } },
      create: {
        userId: viewerId,
        day,
        candidateUserIds: top3,
      },
      update: {
        candidateUserIds: top3,
      },
    });

    return top3;
  }

  /**
   * Records a viewer's decision on one candidate. `pass` is silent.
   * `like` triggers a Begin intent (verse-anchor enforcement at chat
   * boundary, see chat module). `favorite` is the scarce 1/day priority
   * signal — the controller enforces the 1/day cap before calling here.
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
    return { ok: true, decision, day };
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

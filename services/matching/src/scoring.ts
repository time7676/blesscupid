/**
 * v1-restart scoring engine. Pure functions, no Prisma.
 *
 * Weighted sum on a 0–100 scale (per plan §"Match flow → Ranking"):
 *
 *   distance_score      35  Haversine, exponential decay; 0km=35, 50km=0
 *   church_proximity    20  same homeChurch normalized=20, <5km=15, <20km=8, else 0
 *   tradition_match     15  exact=15, adjacent=8, cross=4
 *   whimsical_affinity  15  cosine on 16-dim personality vector
 *   walk_stage_align    10  exact=10, adjacent=5
 *   freshness            5  lastActiveAt: <24h=5, <7d=3, else 0
 *
 * Cold-start: if either side has empty whimsicalAnswers, drop the 15pt
 * whimsical slice and redistribute (+8 distance, +4 tradition, +3 walk_stage).
 */

import { CHURCH_NEAR_KM, CHURCH_SAME_CITY_KM, haversineKm } from "./distance.js";
import { sameChurchName } from "./church-normalize.js";
import { cosine, isEmpty, vectorize } from "./whimsical-affinity.js";
import type {
  ScoreBreakdown,
  ScoringInput,
  Tradition,
  WalkStage,
} from "./types.js";

// ---------------------------------------------------------------------------
// Weights
// ---------------------------------------------------------------------------

export const WEIGHTS = {
  distance: 35,
  churchProximity: 20,
  tradition: 15,
  whimsical: 15,
  walkStage: 10,
  freshness: 5,
} as const;

/** Cold-start redistribution when whimsical signal is unavailable. */
export const COLD_START_BOOST = {
  distance: 8,
  tradition: 4,
  walkStage: 3,
} as const;

// ---------------------------------------------------------------------------
// Tradition affinity table
// ---------------------------------------------------------------------------

type TraditionRel = "exact" | "adjacent" | "cross";

const TRADITION_REL: Record<Tradition, Record<Tradition, TraditionRel>> = {
  catholic: {
    catholic: "exact",
    orthodox: "adjacent",
    protestant: "cross",
    nondenom: "cross",
    other: "cross",
  },
  orthodox: {
    orthodox: "exact",
    catholic: "adjacent",
    protestant: "cross",
    nondenom: "cross",
    other: "cross",
  },
  protestant: {
    protestant: "exact",
    nondenom: "adjacent",
    catholic: "cross",
    orthodox: "cross",
    other: "cross",
  },
  nondenom: {
    nondenom: "exact",
    protestant: "adjacent",
    catholic: "cross",
    orthodox: "cross",
    other: "cross",
  },
  other: {
    other: "exact",
    catholic: "cross",
    orthodox: "cross",
    protestant: "cross",
    nondenom: "cross",
  },
};

// ---------------------------------------------------------------------------
// Walk-stage adjacency
// ---------------------------------------------------------------------------

const WALK_RANK: Record<WalkStage, number> = {
  seeking: 0,
  growing: 1,
  rooted: 2,
};

// ---------------------------------------------------------------------------
// Component scorers
// ---------------------------------------------------------------------------

/**
 * Distance: exponential decay anchored so 0km=full, 50km=0.
 * Using an exp curve keeps near-distance differentiated (Tinder-style)
 * without a hard cliff.
 */
export function distanceScore(km: number, weight: number): number {
  if (km <= 0) return weight;
  if (km >= 50) return 0;
  // exp decay: at km=0 → 1, at km=50 → ~0.0067; rescale so 50→0 exactly.
  const lambda = 5; // higher = steeper decay
  const raw = Math.exp((-km / 50) * lambda);
  const tail = Math.exp(-lambda);
  const norm = (raw - tail) / (1 - tail);
  return Math.max(0, norm) * weight;
}

export function churchProximityScore(
  viewer: ScoringInput,
  candidate: ScoringInput,
): number {
  // Tier 1: same homeChurch by normalized string match.
  if (sameChurchName(viewer.homeChurchName, candidate.homeChurchName)) {
    return 20;
  }
  // Tier 2-3: distance between churches if both have geocoded points.
  if (
    viewer.churchLat !== null &&
    viewer.churchLng !== null &&
    candidate.churchLat !== null &&
    candidate.churchLng !== null
  ) {
    const km = haversineKm(
      viewer.churchLat,
      viewer.churchLng,
      candidate.churchLat,
      candidate.churchLng,
    );
    if (km < CHURCH_NEAR_KM) return 15;
    if (km < CHURCH_SAME_CITY_KM) return 8;
  }
  return 0;
}

export function traditionScore(
  a: Tradition,
  b: Tradition,
  weight: number,
): number {
  const rel = TRADITION_REL[a][b];
  if (rel === "exact") return weight;
  // Re-normalize adjacent/cross to weight scale: exact=15, adjacent=8, cross=4.
  // Default weight is 15. When weight is boosted by cold-start redistribution
  // we scale the adjacent/cross tiers proportionally.
  const ratio = weight / 15;
  if (rel === "adjacent") return 8 * ratio;
  return 4 * ratio;
}

export function walkStageScore(
  a: WalkStage,
  b: WalkStage,
  weight: number,
): number {
  const distance = Math.abs(WALK_RANK[a] - WALK_RANK[b]);
  if (distance === 0) return weight;
  if (distance === 1) return weight / 2;
  return 0;
}

export function whimsicalScore(viewer: ScoringInput, candidate: ScoringInput): number {
  if (isEmpty(viewer.whimsicalAnswers) || isEmpty(candidate.whimsicalAnswers)) {
    return 0;
  }
  const va = vectorize(viewer.whimsicalAnswers);
  const vb = vectorize(candidate.whimsicalAnswers);
  return cosine(va, vb) * WEIGHTS.whimsical;
}

/** Recency: <24h=5, <7d=3, else 0. */
export function freshnessScore(lastActiveAt: Date | null, now: Date = new Date()): number {
  if (!lastActiveAt) return 0;
  const hoursAgo = (now.getTime() - lastActiveAt.getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 24) return 5;
  if (hoursAgo < 24 * 7) return 3;
  return 0;
}

// ---------------------------------------------------------------------------
// Eligibility
// ---------------------------------------------------------------------------

export interface EligibilityOptions {
  /** Default ±10y. */
  ageWindowYears?: number;
  /** When viewer set hideFromUnverified=true, drop unverified candidates. */
  enforceVerifiedFilter?: boolean;
}

export function eligibility(
  viewer: ScoringInput,
  candidate: ScoringInput,
  opts: EligibilityOptions = {},
): boolean {
  if (viewer.userId === candidate.userId) return false;

  // Lifecycle gates.
  if (candidate.isDeleted || viewer.isDeleted) return false;
  if (candidate.isSuspended || viewer.isSuspended) return false;
  if (!candidate.onboardingCompleted) return false;
  if (!candidate.ageVerifiedAdult || !viewer.ageVerifiedAdult) return false;

  // Block lookup.
  if (candidate.blockedByViewer || candidate.blockedByCandidate) return false;
  if (viewer.blockedByCandidate || viewer.blockedByViewer) return false;

  // Gender / seeking align (both sides).
  if (viewer.seeking !== candidate.gender) return false;
  if (candidate.seeking !== viewer.gender) return false;

  // Age window ±10y default — symmetrical (each side filters the other).
  const window = opts.ageWindowYears ?? 10;
  if (Math.abs(viewer.age - candidate.age) > window) return false;

  // Verified-only filter (per Profile.hideFromUnverified preference).
  if (opts.enforceVerifiedFilter !== false) {
    if (viewer.hideFromUnverified && !candidate.isVerified) return false;
    if (candidate.hideFromUnverified && !viewer.isVerified) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Top-level score
// ---------------------------------------------------------------------------

/**
 * Compute total score in [0, 100]. No eligibility check — call
 * `eligibility(viewer, candidate)` separately and skip ineligible pairs.
 */
export function score(viewer: ScoringInput, candidate: ScoringInput): number {
  return scoreBreakdown(viewer, candidate).total;
}

export function scoreBreakdown(
  viewer: ScoringInput,
  candidate: ScoringInput,
): ScoreBreakdown {
  const coldStart =
    isEmpty(viewer.whimsicalAnswers) || isEmpty(candidate.whimsicalAnswers);

  const distanceWeight =
    WEIGHTS.distance + (coldStart ? COLD_START_BOOST.distance : 0);
  const traditionWeight =
    WEIGHTS.tradition + (coldStart ? COLD_START_BOOST.tradition : 0);
  const walkWeight =
    WEIGHTS.walkStage + (coldStart ? COLD_START_BOOST.walkStage : 0);

  const km = haversineKm(viewer.lat, viewer.lng, candidate.lat, candidate.lng);
  const distance = distanceScore(km, distanceWeight);
  const churchProximity = churchProximityScore(viewer, candidate);
  const tradition = traditionScore(
    viewer.tradition,
    candidate.tradition,
    traditionWeight,
  );
  const whimsical = coldStart ? 0 : whimsicalScore(viewer, candidate);
  const walkStage = walkStageScore(
    viewer.walkStage,
    candidate.walkStage,
    walkWeight,
  );
  const freshness = freshnessScore(candidate.lastActiveAt);

  const total =
    distance + churchProximity + tradition + whimsical + walkStage + freshness;

  return {
    total,
    distance,
    churchProximity,
    tradition,
    whimsical,
    walkStage,
    freshness,
  };
}

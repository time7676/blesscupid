/**
 * BlessCupid v1-restart matching types — pure data shapes only.
 * Mirrors the new Prisma enums in `apps/api/prisma/schema.prisma`.
 */

export type Gender = "male" | "female";

export type Tradition =
  | "catholic"
  | "protestant"
  | "orthodox"
  | "nondenom"
  | "other";

export type WalkStage = "seeking" | "growing" | "rooted";

export type MarriageIntent = "yes" | "maybe" | "no";

export type DecisionKind = "pass" | "like" | "super_like";

export type SubscriptionTier = "free" | "blessplus";

export type ProximityHint = "near" | "same_city" | "different_city";

export type DistanceBucket = "<=5km" | "5-10km" | "10-20km" | "20+km";

/** Whimsical answers — q1, q3, q5, q7. Each chip is one of 4 axis labels. */
export interface WhimsicalAnswers {
  q1?: string;
  q3?: string;
  q5?: string;
  q7?: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * Input shape consumed by `score(viewer, candidate)`. Never serialized to a
 * client — strip via `apps/api/src/matching/candidate-card.dto.ts` first.
 */
export interface ScoringInput {
  userId: string;
  age: number;
  gender: Gender;
  seeking: Gender;
  lat: number;
  lng: number;
  city: string;
  homeChurchName: string | null;
  churchLat: number | null;
  churchLng: number | null;
  tradition: Tradition;
  walkStage: WalkStage;
  marriageIntent: MarriageIntent;
  whimsicalAnswers: WhimsicalAnswers | null;
  isVerified: boolean;
  hideFromUnverified: boolean;
  lastActiveAt: Date | null;
  // Eligibility fields (mirrors User-row state):
  ageVerifiedAdult: boolean;
  isSuspended: boolean;
  isDeleted: boolean;
  onboardingCompleted: boolean;
  // Pair-state markers — set by caller after Block lookup:
  blockedByViewer?: boolean;
  blockedByCandidate?: boolean;
}

export interface ScoreBreakdown {
  total: number;
  distance: number;
  churchProximity: number;
  tradition: number;
  whimsical: number;
  walkStage: number;
  freshness: number;
}

export interface ScoredCandidate {
  candidateUserId: string;
  score: ScoreBreakdown;
}

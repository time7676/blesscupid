import type { CandidateProfile, ScoreBreakdown } from "./types.js";

/**
 * Public projection of a candidate that is safe to send over the matching
 * API. NO email, phone, or precise coordinates are present here.
 *
 * Approximate distance is sent in 1km buckets — never raw lat/lng.
 */
export interface PublicCandidate {
  userId: string;
  displayName: string;
  age: number;
  approximateDistanceKm: number;
  faith: {
    denomination: CandidateProfile["faith"]["denomination"];
    churchAttendance: CandidateProfile["faith"]["churchAttendance"];
    baptized: boolean;
    marriageIntent: CandidateProfile["faith"]["marriageIntent"];
    spiritualGifts: readonly CandidateProfile["faith"]["spiritualGifts"][number][];
  };
  photoUrl: string | null;
  matchScore: number; // headline only, never the breakdown
}

const PII_KEYS = [
  "email",
  "phone",
  "exactCoordinates",
  "location",
  "covenantSigned",
  "ageVerifiedAdult",
  "bannedOrSuspended",
  "bioApproved",
  "photoApproved",
  "maxDistanceKm",
  "agePreference",
  "seekingGender",
  "gender",
] as const;

/**
 * Strip a candidate down to the public projection. Distance is bucketed to
 * the nearest km using the viewer's location and never returned more
 * precisely than that. Score is reduced to `total` only — never the per-
 * factor breakdown, since that would leak inferences about the candidate
 * (e.g. exact age or denomination weights).
 */
export function sanitizeForClient(
  viewer: Pick<CandidateProfile, "location">,
  candidate: CandidateProfile,
  score: ScoreBreakdown,
): PublicCandidate {
  const km = approximateDistanceKm(viewer.location, candidate.location);
  return {
    userId: candidate.userId,
    displayName: candidate.displayName,
    age: candidate.age,
    approximateDistanceKm: km,
    faith: {
      denomination: candidate.faith.denomination,
      churchAttendance: candidate.faith.churchAttendance,
      baptized: candidate.faith.baptized,
      marriageIntent: candidate.faith.marriageIntent,
      spiritualGifts: [...candidate.faith.spiritualGifts],
    },
    photoUrl: candidate.photoUrl,
    matchScore: roundToOne(score.total),
  };
}

/**
 * Defensive guard for tests/lints — returns the keys forbidden in any
 * client-facing payload. Used by the API layer to assert no leakage.
 */
export function piiKeys(): readonly string[] {
  return PII_KEYS;
}

/** Bucket to 1km — protects against location triangulation. */
function approximateDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const km = 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  return Math.round(km);
}

function roundToOne(n: number): number {
  return Math.round(n * 10) / 10;
}

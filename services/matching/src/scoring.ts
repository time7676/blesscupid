import type {
  CandidateProfile,
  ScoreBreakdown,
  Denomination,
  MarriageIntent,
  ChurchAttendance,
} from "./types.js";

/**
 * Faith-first weights. Denomination + marriage intent dominate.
 * Sum of MAX components <= 100. Ordering of weights is the product spec.
 */
export const WEIGHTS = {
  denomination: 30,
  marriageIntent: 25,
  geo: 15,
  age: 15,
  attendance: 10,
  spiritualGifts: 5,
} as const;

const DENOM_AFFINITY: Record<Denomination, Record<Denomination, number>> = {
  catholic: { catholic: 1.0, orthodox: 0.6, protestant: 0.4, other: 0.2 },
  orthodox: { orthodox: 1.0, catholic: 0.6, protestant: 0.4, other: 0.2 },
  protestant: { protestant: 1.0, catholic: 0.4, orthodox: 0.4, other: 0.2 },
  other: { other: 1.0, catholic: 0.2, orthodox: 0.2, protestant: 0.2 },
};

const INTENT_RANK: Record<MarriageIntent, number> = {
  within_1y: 0,
  within_2y: 1,
  within_5y: 2,
  open_timeline: 3,
};

const ATTENDANCE_RANK: Record<ChurchAttendance, number> = {
  weekly: 0,
  monthly: 1,
  occasional: 2,
  rarely: 3,
};

export function denominationScore(
  a: Denomination,
  b: Denomination,
): number {
  const affinity = DENOM_AFFINITY[a][b];
  return affinity * WEIGHTS.denomination;
}

export function marriageIntentScore(
  a: MarriageIntent,
  b: MarriageIntent,
): number {
  const distance = Math.abs(INTENT_RANK[a] - INTENT_RANK[b]);
  // 0 distance => full points; 3 distance => 0 points.
  const factor = Math.max(0, 1 - distance / 3);
  return factor * WEIGHTS.marriageIntent;
}

export function attendanceScore(
  a: ChurchAttendance,
  b: ChurchAttendance,
): number {
  const distance = Math.abs(ATTENDANCE_RANK[a] - ATTENDANCE_RANK[b]);
  const factor = Math.max(0, 1 - distance / 3);
  return factor * WEIGHTS.attendance;
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function geoScore(
  viewer: CandidateProfile,
  candidate: CandidateProfile,
): number {
  const distanceKm = haversineKm(viewer.location, candidate.location);
  const cap = Math.max(viewer.maxDistanceKm, 1);
  if (distanceKm > cap) return 0;
  const factor = 1 - distanceKm / cap;
  return factor * WEIGHTS.geo;
}

export function ageScore(
  viewer: CandidateProfile,
  candidate: CandidateProfile,
): number {
  const { minAge, maxAge } = viewer.agePreference;
  if (candidate.age < minAge || candidate.age > maxAge) return 0;
  const span = Math.max(maxAge - minAge, 1);
  const center = (minAge + maxAge) / 2;
  const distance = Math.abs(candidate.age - center);
  const factor = Math.max(0, 1 - distance / (span / 2));
  return factor * WEIGHTS.age;
}

export function spiritualGiftsScore(
  viewer: CandidateProfile,
  candidate: CandidateProfile,
): number {
  const a = new Set(viewer.faith.spiritualGifts);
  const b = new Set(candidate.faith.spiritualGifts);
  if (a.size === 0 || b.size === 0) return 0;
  let overlap = 0;
  for (const g of a) if (b.has(g)) overlap++;
  const union = new Set([...a, ...b]).size;
  const jaccard = overlap / union;
  return jaccard * WEIGHTS.spiritualGifts;
}

/**
 * Compatibility hard gate. Returns true only if the pair is eligible to be
 * scored at all. Holy guardrails are enforced here, not in scoring.
 */
export function isEligible(
  viewer: CandidateProfile,
  candidate: CandidateProfile,
): boolean {
  if (viewer.userId === candidate.userId) return false;
  if (!candidate.ageVerifiedAdult || !viewer.ageVerifiedAdult) return false;
  if (!candidate.covenantSigned || !viewer.covenantSigned) return false;
  if (candidate.bannedOrSuspended || viewer.bannedOrSuspended) return false;
  if (!candidate.photoApproved || !candidate.bioApproved) return false;
  if (candidate.gender !== viewer.seekingGender) return false;
  if (viewer.gender !== candidate.seekingGender) return false;
  if (
    candidate.age < viewer.agePreference.minAge ||
    candidate.age > viewer.agePreference.maxAge
  )
    return false;
  if (
    viewer.age < candidate.agePreference.minAge ||
    viewer.age > candidate.agePreference.maxAge
  )
    return false;
  return true;
}

export function scorePair(
  viewer: CandidateProfile,
  candidate: CandidateProfile,
): ScoreBreakdown {
  const denomination = denominationScore(
    viewer.faith.denomination,
    candidate.faith.denomination,
  );
  const marriageIntent = marriageIntentScore(
    viewer.faith.marriageIntent,
    candidate.faith.marriageIntent,
  );
  const geo = geoScore(viewer, candidate);
  const age = ageScore(viewer, candidate);
  const attendance = attendanceScore(
    viewer.faith.churchAttendance,
    candidate.faith.churchAttendance,
  );
  const spiritualGifts = spiritualGiftsScore(viewer, candidate);
  const total =
    denomination + marriageIntent + geo + age + attendance + spiritualGifts;
  return { total, denomination, marriageIntent, geo, age, attendance, spiritualGifts };
}

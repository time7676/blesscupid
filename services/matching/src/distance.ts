/**
 * Haversine distance helpers. Pure constants + math. No I/O.
 *
 * Used by `scoring.ts` for the distance + church-proximity weights, and by
 * `candidate-card.dto.ts` to bucket distance into privacy-safe ranges.
 */

import type { DistanceBucket, ProximityHint } from "./types.js";

export const EARTH_RADIUS_KM = 6371;

/** Distance decay constants (see scoring.distanceScore). */
export const DISTANCE_FULL_KM = 0;
export const DISTANCE_ZERO_KM = 50;

/** Church-proximity tier thresholds (km). */
export const CHURCH_NEAR_KM = 5;
export const CHURCH_SAME_CITY_KM = 20;

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Bucket a raw kilometer distance into a privacy-safe label. */
export function bucketKm(km: number): DistanceBucket {
  if (km <= 5) return "<=5km";
  if (km <= 10) return "5-10km";
  if (km <= 20) return "10-20km";
  return "20+km";
}

/**
 * Coarse hint for pre-match candidate cards. Matches plan-CEO privacy spec:
 * never expose churchLat/churchLng or homeChurchName before mutual match +
 * verified.
 */
export function proximityHint(
  viewerLat: number,
  viewerLng: number,
  viewerCity: string,
  candidateLat: number,
  candidateLng: number,
  candidateCity: string,
): ProximityHint {
  const km = haversineKm(viewerLat, viewerLng, candidateLat, candidateLng);
  if (km <= CHURCH_NEAR_KM) return "near";
  if (viewerCity && candidateCity && viewerCity === candidateCity) {
    return "same_city";
  }
  return "different_city";
}

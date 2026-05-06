/**
 * Privacy-safe candidate card DTO.
 *
 * Per /plan-ceo-review §"Privacy & Geo Exposure Rules": NEVER include
 *   - lat / lng
 *   - homeChurchName / churchLat / churchLng
 * unless the requesting viewer has BOTH:
 *   1. A `Match` row with this candidate
 *   2. viewer.isVerified && candidate.isVerified
 * In that case, surface `homeChurchName` via `revealedHomeChurchName`.
 */

import type {
  DistanceBucket,
  ProximityHint,
  Tradition,
  WalkStage,
  WhimsicalAnswers,
} from '@blesscupid/matching';

export interface CandidatePhotoDto {
  url: string;
  position: number;
}

export interface CandidateStatusVerseDto {
  verseRef: string;
  verseText: string;
}

export interface CandidateCardDto {
  id: string;
  displayName: string;
  age: number;
  photos: CandidatePhotoDto[];
  city: string;
  distanceBucket: DistanceBucket;
  proximityHint: ProximityHint;
  tradition: Tradition;
  walkStage: WalkStage;
  isVerified: boolean;
  statusVerse?: CandidateStatusVerseDto;
  whimsicalAnswers: WhimsicalAnswers;
  bio: string | null;
  /**
   * Only set on post-match-reveal: viewer is mutually matched AND both
   * sides are verified. Otherwise this field is undefined.
   */
  revealedHomeChurchName?: string;
}

/**
 * Sentinel list — assert in tests that no card response contains any of
 * these keys at the top level.
 */
export const FORBIDDEN_KEYS_PRE_MATCH = [
  'lat',
  'lng',
  'homeChurchName',
  'churchLat',
  'churchLng',
] as const;

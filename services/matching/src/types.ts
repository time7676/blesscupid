export type Denomination =
  | "catholic"
  | "protestant"
  | "orthodox"
  | "other";

export type Gender = "male" | "female";

export type MarriageIntent =
  | "within_1y"
  | "within_2y"
  | "within_5y"
  | "open_timeline";

export type ChurchAttendance =
  | "weekly"
  | "monthly"
  | "occasional"
  | "rarely";

export type SpiritualGift =
  | "teaching"
  | "service"
  | "mercy"
  | "exhortation"
  | "giving"
  | "leadership"
  | "evangelism"
  | "hospitality";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface AgePreference {
  minAge: number;
  maxAge: number;
}

export interface FaithProfile {
  denomination: Denomination;
  churchAttendance: ChurchAttendance;
  baptized: boolean;
  marriageIntent: MarriageIntent;
  spiritualGifts: SpiritualGift[];
}

/**
 * Full candidate profile as held by the matching engine.
 * Note: this includes PII. Use {@link sanitizeForClient} before
 * returning over an API.
 */
export interface CandidateProfile {
  userId: string;
  displayName: string;
  age: number;
  gender: Gender;
  seekingGender: Gender;
  location: GeoPoint;
  maxDistanceKm: number;
  agePreference: AgePreference;
  faith: FaithProfile;
  photoUrl: string | null;
  bioApproved: boolean;
  photoApproved: boolean;
  covenantSigned: boolean;
  ageVerifiedAdult: boolean;
  bannedOrSuspended: boolean;
  // Anti-PII fields below MUST be stripped before client serialization.
  email: string;
  phone?: string;
  exactCoordinates?: GeoPoint;
}

export interface ScoreBreakdown {
  total: number;
  denomination: number;
  marriageIntent: number;
  geo: number;
  age: number;
  spiritualGifts: number;
  attendance: number;
}

export interface ScoredCandidate {
  candidateUserId: string;
  score: ScoreBreakdown;
}

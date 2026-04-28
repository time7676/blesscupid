import type { CandidateProfile } from "../src/types.js";

export function makeProfile(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  const base: CandidateProfile = {
    userId: "u-base",
    displayName: "Base",
    age: 28,
    gender: "male",
    seekingGender: "female",
    location: { lat: -8.5069, lng: 115.2625 }, // Bali / Denpasar
    maxDistanceKm: 50,
    agePreference: { minAge: 24, maxAge: 32 },
    faith: {
      denomination: "catholic",
      churchAttendance: "weekly",
      baptized: true,
      marriageIntent: "within_2y",
      spiritualGifts: ["service", "hospitality"],
    },
    photoUrl: "https://example.com/photo.jpg",
    bioApproved: true,
    photoApproved: true,
    covenantSigned: true,
    ageVerifiedAdult: true,
    bannedOrSuspended: false,
    email: "base@example.com",
    phone: "+62000000000",
    exactCoordinates: { lat: -8.5069, lng: 115.2625 },
  };
  return { ...base, ...overrides, faith: { ...base.faith, ...(overrides.faith ?? {}) } };
}

/** Generate a small pool of N candidates with varying traits. */
export function makePool(n: number, seedPrefix = "u"): CandidateProfile[] {
  const denoms = ["catholic", "protestant", "orthodox", "other"] as const;
  const intents = ["within_1y", "within_2y", "within_5y", "open_timeline"] as const;
  const out: CandidateProfile[] = [];
  for (let i = 0; i < n; i++) {
    out.push(
      makeProfile({
        userId: `${seedPrefix}-${i}`,
        displayName: `User ${i}`,
        age: 24 + (i % 9),
        gender: "female",
        seekingGender: "male",
        location: { lat: -8.5069 + (i % 5) * 0.05, lng: 115.2625 + (i % 5) * 0.05 },
        faith: {
          denomination: denoms[i % denoms.length]!,
          churchAttendance: i % 2 === 0 ? "weekly" : "monthly",
          baptized: i % 3 !== 0,
          marriageIntent: intents[i % intents.length]!,
          spiritualGifts: i % 2 === 0 ? ["teaching"] : ["service"],
        },
      }),
    );
  }
  return out;
}

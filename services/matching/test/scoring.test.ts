import { describe, it, expect } from "vitest";
import {
  scorePair,
  isEligible,
  WEIGHTS,
  denominationScore,
  marriageIntentScore,
} from "../src/scoring.js";
import { makeProfile } from "./fixtures.js";

describe("scoring — faith-first weighting", () => {
  it("denomination weight is the largest factor", () => {
    expect(WEIGHTS.denomination).toBeGreaterThanOrEqual(WEIGHTS.marriageIntent);
    expect(WEIGHTS.denomination).toBeGreaterThan(WEIGHTS.geo);
    expect(WEIGHTS.denomination).toBeGreaterThan(WEIGHTS.age);
    expect(WEIGHTS.denomination).toBeGreaterThan(WEIGHTS.spiritualGifts);
  });

  it("same denomination scores higher than different", () => {
    expect(denominationScore("catholic", "catholic")).toBeGreaterThan(
      denominationScore("catholic", "protestant"),
    );
  });

  it("aligned marriage intent scores higher than mismatched", () => {
    expect(marriageIntentScore("within_1y", "within_1y")).toBeGreaterThan(
      marriageIntentScore("within_1y", "open_timeline"),
    );
  });

  it("scorePair returns higher total for faith-aligned candidate", () => {
    const viewer = makeProfile({ userId: "viewer" });
    const aligned = makeProfile({
      userId: "aligned",
      gender: "female",
      seekingGender: "male",
      faith: {
        denomination: "catholic",
        churchAttendance: "weekly",
        baptized: true,
        marriageIntent: "within_2y",
        spiritualGifts: ["service"],
      },
    });
    const misaligned = makeProfile({
      userId: "misaligned",
      gender: "female",
      seekingGender: "male",
      faith: {
        denomination: "other",
        churchAttendance: "rarely",
        baptized: false,
        marriageIntent: "open_timeline",
        spiritualGifts: [],
      },
    });
    const a = scorePair(viewer, aligned).total;
    const b = scorePair(viewer, misaligned).total;
    expect(a).toBeGreaterThan(b);
  });
});

describe("eligibility — holy guardrails", () => {
  it("rejects unverified-age candidates", () => {
    const viewer = makeProfile({ userId: "viewer" });
    const candidate = makeProfile({
      userId: "x",
      gender: "female",
      seekingGender: "male",
      ageVerifiedAdult: false,
    });
    expect(isEligible(viewer, candidate)).toBe(false);
  });

  it("rejects banned candidates", () => {
    const viewer = makeProfile({ userId: "viewer" });
    const candidate = makeProfile({
      userId: "x",
      gender: "female",
      seekingGender: "male",
      bannedOrSuspended: true,
    });
    expect(isEligible(viewer, candidate)).toBe(false);
  });

  it("rejects unsigned covenant", () => {
    const viewer = makeProfile({ userId: "viewer" });
    const candidate = makeProfile({
      userId: "x",
      gender: "female",
      seekingGender: "male",
      covenantSigned: false,
    });
    expect(isEligible(viewer, candidate)).toBe(false);
  });

  it("rejects unmoderated photo or bio", () => {
    const viewer = makeProfile({ userId: "viewer" });
    const noPhoto = makeProfile({
      userId: "x",
      gender: "female",
      seekingGender: "male",
      photoApproved: false,
    });
    const noBio = makeProfile({
      userId: "y",
      gender: "female",
      seekingGender: "male",
      bioApproved: false,
    });
    expect(isEligible(viewer, noPhoto)).toBe(false);
    expect(isEligible(viewer, noBio)).toBe(false);
  });

  it("rejects out-of-age-pref candidates from both sides", () => {
    const viewer = makeProfile({
      userId: "viewer",
      agePreference: { minAge: 25, maxAge: 30 },
    });
    const tooYoung = makeProfile({
      userId: "x",
      gender: "female",
      seekingGender: "male",
      age: 20,
    });
    expect(isEligible(viewer, tooYoung)).toBe(false);
  });
});

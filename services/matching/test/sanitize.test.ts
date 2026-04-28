import { describe, it, expect } from "vitest";
import { sanitizeForClient, piiKeys } from "../src/sanitize.js";
import { scorePair } from "../src/scoring.js";
import { makeProfile } from "./fixtures.js";

describe("PII sanitization", () => {
  it("strips email, phone, exact coordinates, and other private fields", () => {
    const viewer = makeProfile({ userId: "viewer" });
    const candidate = makeProfile({
      userId: "x",
      gender: "female",
      seekingGender: "male",
      email: "secret@example.com",
      phone: "+62-0000000",
      exactCoordinates: { lat: 1.234, lng: 5.678 },
    });
    const score = scorePair(viewer, candidate);
    const safe = sanitizeForClient(viewer, candidate, score);
    const serialized = JSON.stringify(safe);
    for (const key of piiKeys()) {
      expect(serialized).not.toContain(key);
    }
    expect(serialized).not.toContain("secret@example.com");
    expect(serialized).not.toContain("+62-0000000");
    // Exact coordinate digits must not leak
    expect(serialized).not.toContain("1.234");
    expect(serialized).not.toContain("5.678");
  });

  it("does not include the per-factor score breakdown", () => {
    const viewer = makeProfile({ userId: "viewer" });
    const candidate = makeProfile({
      userId: "x",
      gender: "female",
      seekingGender: "male",
    });
    const score = scorePair(viewer, candidate);
    const safe = sanitizeForClient(viewer, candidate, score);
    expect(Object.keys(safe)).not.toContain("denomination");
    expect(Object.keys(safe)).not.toContain("geo");
    expect("matchScore" in safe).toBe(true);
  });

  it("returns approximate distance bucketed to 1km", () => {
    const viewer = makeProfile({
      userId: "viewer",
      location: { lat: 0, lng: 0 },
    });
    const candidate = makeProfile({
      userId: "x",
      gender: "female",
      seekingGender: "male",
      location: { lat: 0.01, lng: 0.01 }, // ~1.5km
    });
    const score = scorePair(viewer, candidate);
    const safe = sanitizeForClient(viewer, candidate, score);
    expect(Number.isInteger(safe.approximateDistanceKm)).toBe(true);
    expect(safe.approximateDistanceKm).toBeGreaterThanOrEqual(0);
    expect(safe.approximateDistanceKm).toBeLessThan(5);
  });
});

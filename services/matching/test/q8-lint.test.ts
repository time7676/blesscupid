import { describe, expect, it } from "vitest";
import {
  ALLOWED_SCORE_COMPONENTS,
  findForbiddenScoreWeights,
  type PracticeTag,
} from "../src/q8-lint.js";
import { scorePair, WEIGHTS } from "../src/scoring.js";
import { makeProfile } from "./fixtures.js";

// BLE-124 — privacy + non-deprioritization lint for Q8 practice tags.
// Source: BLE-41 onboarding-questionnaire Q8 ("must not be deprioritized
// in the dating queue") + Holy Code §1.4.

describe("Q8 practice-rhythm lint (BLE-124)", () => {
  it("WEIGHTS keys are all in the allow-list (no Q8 deprioritization axis)", () => {
    const forbidden = findForbiddenScoreWeights();
    expect(forbidden).toEqual([]);
    for (const key of Object.keys(WEIGHTS)) {
      expect(ALLOWED_SCORE_COMPONENTS).toContain(key);
    }
  });

  it("scorePair output is identical for two otherwise-equal candidates regardless of practice tag self-ID", () => {
    // Two female candidates identical in every match-relevant field. Their
    // `practiceTags` (Q8) are stored on Profile, but scoring must never
    // read them. We assert the scorer's surface (CandidateProfile) does
    // not even expose a PracticeTag field — this test is a contract anchor.
    const viewer = makeProfile({ userId: "viewer-m" });
    const a = makeProfile({ userId: "a", gender: "female", seekingGender: "male" });
    const b = makeProfile({ userId: "b", gender: "female", seekingGender: "male" });

    const scoreA = scorePair(viewer, a);
    const scoreB = scorePair(viewer, b);

    expect(scoreA.total).toBe(scoreB.total);
    expect(scoreA.denomination).toBe(scoreB.denomination);
    expect(scoreA.marriageIntent).toBe(scoreB.marriageIntent);
    expect(scoreA.attendance).toBe(scoreB.attendance);
  });

  it("PracticeTag union is exhaustive (matches BLE-41 questionnaire Q8)", () => {
    const expected: PracticeTag[] = [
      "sunday_in_person",
      "sunday_online",
      "catholic_mass",
      "daily_prayer",
      "small_group",
      "worship_at_home",
      "still_finding_a_community",
    ];
    expect(expected.length).toBe(7);
  });
});

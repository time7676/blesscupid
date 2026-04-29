// BLE-124 — Q8 (faith practice rhythm) lint rule.
//
// Holy Code §1.4 + BLE-41 onboarding-questionnaire doc explicitly forbid
// deprioritization in the dating queue based on practice tags. Specifically:
//
//   "A user who selects only `still_finding_a_community` must not be
//    deprioritized in the dating queue."
//
// This module is the single source of truth for that lint. The scoring
// engine MUST NOT read PracticeTag at all; this guard is invoked from a
// unit test that asserts ScoreBreakdown is independent of practice tags
// for any otherwise-identical pair.
import { WEIGHTS } from "./scoring.js";
import type { ScoreBreakdown } from "./types.js";

export type PracticeTag =
  | "sunday_in_person"
  | "sunday_online"
  | "catholic_mass"
  | "daily_prayer"
  | "small_group"
  | "worship_at_home"
  | "still_finding_a_community";

/**
 * Allow-list of score components. Any future extension to ScoreBreakdown
 * MUST be added here AND must not derive from PracticeTag. The lint test
 * asserts WEIGHTS keys are a subset of this list.
 */
export const ALLOWED_SCORE_COMPONENTS: ReadonlyArray<keyof ScoreBreakdown> = [
  "total",
  "denomination",
  "marriageIntent",
  "geo",
  "age",
  "spiritualGifts",
  "attendance",
];

/**
 * Returns the set of WEIGHTS keys that are not in the allow-list.
 * If non-empty, the matching engine has been extended to deprioritize
 * along a forbidden axis — fail the lint.
 */
export function findForbiddenScoreWeights(): string[] {
  const allowed = new Set<string>(ALLOWED_SCORE_COMPONENTS);
  return Object.keys(WEIGHTS).filter((k) => !allowed.has(k));
}

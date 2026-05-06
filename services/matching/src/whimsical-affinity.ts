/**
 * Whimsical-affinity scoring (15pt slice).
 *
 * Onboarding cards 1, 3, 5, 7 each ask one whimsical question with a 4-chip
 * answer set. Each question maps to a 4-dim one-hot vector across its chips.
 * The personality vector is the concatenation of all four (16 dims total).
 *
 * Affinity = cosine similarity in [0, 1] × 15.
 *
 * Chip → axis mapping (must stay in sync with mobile onboarding cards):
 *
 *   q1 — "If you were an animal you'd be…"
 *     0: dolphin   1: lion       2: owl        3: golden retriever
 *
 *   q3 — "Saturday morning, you're most likely…"
 *     0: outside   1: in a book  2: cooking    3: brunch with friends
 *
 *   q5 — "Your love language leans toward…"
 *     0: words     1: time       2: touch      3: gifts
 *     (Note: this is a *softer* read, not the 5LL canonical map; chips
 *     condensed to 4 for vector symmetry. acts-of-service folds into "time".)
 *
 *   q7 — "When stressed you reach for…"
 *     0: prayer    1: a walk     2: a friend   3: silence
 *
 * Unknown chip → contributes a zero subvector for that question (graceful
 * degradation; the cold-start path in `scoring.ts` handles fully-null answers).
 *
 * Pure function. No I/O.
 */

import type { WhimsicalAnswers } from "./types.js";

export const WHIMSICAL_DIMS = 16;
export const QUESTION_KEYS = ["q1", "q3", "q5", "q7"] as const;
export type WhimsicalQuestionKey = (typeof QUESTION_KEYS)[number];

/** Canonical chip ordering per question. Order is load-bearing. */
export const CHIP_AXES: Record<WhimsicalQuestionKey, readonly string[]> = {
  q1: ["dolphin", "lion", "owl", "golden_retriever"],
  q3: ["outside", "book", "cooking", "brunch"],
  q5: ["words", "time", "touch", "gifts"],
  q7: ["prayer", "walk", "friend", "silence"],
} as const;

/**
 * Convert WhimsicalAnswers into a 16-dim one-hot vector.
 * Returned vector length is always 16 — unknown / missing answers leave
 * their 4-dim block at zeros.
 */
export function vectorize(answers: WhimsicalAnswers | null): number[] {
  const v = new Array<number>(WHIMSICAL_DIMS).fill(0);
  if (!answers) return v;
  let offset = 0;
  for (const q of QUESTION_KEYS) {
    const chip = answers[q];
    const axes = CHIP_AXES[q];
    if (chip) {
      const idx = axes.indexOf(chip);
      if (idx >= 0) {
        v[offset + idx] = 1;
      }
    }
    offset += 4;
  }
  return v;
}

/** Cosine similarity in [0, 1]. Returns 0 when either vector is all zeros. */
export function cosine(a: readonly number[], b: readonly number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** True when the answer payload has no usable signal. */
export function isEmpty(answers: WhimsicalAnswers | null): boolean {
  if (!answers) return true;
  for (const q of QUESTION_KEYS) {
    const chip = answers[q];
    if (chip && CHIP_AXES[q].includes(chip)) return false;
  }
  return true;
}

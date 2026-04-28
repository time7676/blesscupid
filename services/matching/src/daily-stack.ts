import { isEligible, scorePair } from "./scoring.js";
import type { CandidateProfile, ScoredCandidate } from "./types.js";

export const STACK_MIN = 10;
export const STACK_MAX = 20;

/**
 * Tiny deterministic 32-bit hash so two users on the same day get
 * different jitter — small noise breaks ties identically across replays
 * which keeps stacks distinct without ML.
 */
function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

function jitter(viewerId: string, candidateId: string, dayKey: string): number {
  const h = fnv1a(`${viewerId}|${candidateId}|${dayKey}`);
  // [-0.5, +0.5] points — small enough not to overcome real signal,
  // big enough to break exact ties consistently per user/day.
  return (h / 0xffffffff - 0.5);
}

export function dayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export interface DailyStackOptions {
  size?: number;
  /** ISO date "YYYY-MM-DD". Defaults to UTC today. */
  day?: string;
  /** User IDs already shown to this viewer in the last N days. */
  excludeUserIds?: ReadonlySet<string>;
}

/**
 * Build the daily curated stack for a viewer.
 *
 * Spec (BLE-8):
 *  - 10-20 candidates per user per day
 *  - Faith-first scoring (handled in scoring.ts)
 *  - Mutual interest is NOT required to appear in the stack — only to chat.
 *  - Determinism: same inputs → same stack (so push notifications match UI).
 */
export function buildDailyStack(
  viewer: CandidateProfile,
  pool: readonly CandidateProfile[],
  options: DailyStackOptions = {},
): ScoredCandidate[] {
  const size = clamp(options.size ?? STACK_MAX, STACK_MIN, STACK_MAX);
  const day = options.day ?? dayKey();
  const excluded = options.excludeUserIds ?? new Set<string>();

  const eligible = pool.filter(
    (c) => isEligible(viewer, c) && !excluded.has(c.userId),
  );

  const scored = eligible.map((c) => {
    const breakdown = scorePair(viewer, c);
    const jitterAmount = jitter(viewer.userId, c.userId, day);
    return {
      candidateUserId: c.userId,
      score: { ...breakdown, total: breakdown.total + jitterAmount },
    };
  });

  scored.sort((a, b) => b.score.total - a.score.total);
  return scored.slice(0, size);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

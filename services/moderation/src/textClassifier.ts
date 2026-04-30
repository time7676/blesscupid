import type { Decision, HardCategory, ModerationResult, SoftFlag } from "./types.js";
import { loadBannedPhrases, type BannedPhrase } from "./bannedPhrases.js";
import { lettersOnly, normalizeForMatch } from "./textNormalize.js";
import { scoreText } from "./ruleEngine.js";

/**
 * Thresholds. Pastor-approved 2026-04-30 (blanket approval). Hate + self-harm
 * intentionally HARD-block: under HOLY-by-design positioning, surfaced
 * harm-signal content does not enter human queue — it never reaches recipient.
 *
 * - score >= BLOCK → block immediately, no human review.
 * - BLOCK > score >= QUEUE → human moderator review before delivery.
 */
export const DEFAULT_THRESHOLDS = {
  BLOCK: {
    sexual: 0.7,
    sexual_minors: 0.05,
    harassment_severe: 0.5,
    hate: 0.7,
    self_harm: 0.6,
    violence_graphic: 0.7,
  } as Record<string, number>,
  QUEUE: {
    sexual: 0.4,
    sexual_minors: 0.01,
    harassment_severe: 0.3,
    hate: 0.5,
    self_harm: 0.4,
    violence_graphic: 0.5,
  } as Record<string, number>,
};

/** Map rule engine category names → our HardCategory taxonomy. */
const CATEGORY_MAP: Record<string, HardCategory> = {
  sexual: "sexual",
  sexual_minors: "sexual_minors",
  self_harm: "self_harm",
  hate: "hate",
  harassment_severe: "harassment_severe",
  violence_graphic: "violence_graphic",
};

export interface TextClassifierConfig {
  bannedPhrases?: ReadonlyArray<BannedPhrase>;
  thresholds?: typeof DEFAULT_THRESHOLDS;
}

export class TextClassifier {
  private readonly bannedPhrases: ReadonlyArray<BannedPhrase>;
  private readonly thresholds: typeof DEFAULT_THRESHOLDS;

  constructor(private readonly cfg: TextClassifierConfig) {
    this.bannedPhrases = loadBannedPhrases(cfg.bannedPhrases);
    this.thresholds = cfg.thresholds ?? DEFAULT_THRESHOLDS;
  }

  async classify(text: string): Promise<ModerationResult> {
    const normalized = normalizeForMatch(text);
    const compact = lettersOnly(text);

    // Pass 1: banned phrase match.
    const phraseHits = this.matchBannedPhrases(normalized, compact);
    const hardPhraseHit = phraseHits.find((h) => h.severity === "hard");
    if (hardPhraseHit) {
      return {
        decision: "block",
        reasons: ["sexual"],
        flags: this.collectSoftFlags(phraseHits),
        rawScores: { banned_phrase: 1, matched: 1 },
        reviewerNote: `blocked by banned phrase: ${hardPhraseHit.needle}`,
      };
    }

    // Pass 2: rule-based scoring.
    const scores = scoreText(text);
    const { decision, reasons } = this.scoreToDecision(scores);

    return {
      decision,
      reasons,
      flags: this.collectSoftFlags(phraseHits),
      rawScores: scores as Record<string, number>,
      reviewerNote: this.buildNote(decision, reasons, phraseHits),
    };
  }

  private matchBannedPhrases(normalized: string, compact: string): BannedPhrase[] {
    const hits: BannedPhrase[] = [];
    for (const p of this.bannedPhrases) {
      const needleCompact = p.needle.replace(/[^a-z]/g, "");
      if (normalized.includes(p.needle) || compact.includes(needleCompact)) {
        hits.push(p);
      }
    }
    return hits;
  }

  private collectSoftFlags(hits: BannedPhrase[]): SoftFlag[] {
    const flags = new Set<SoftFlag>();
    for (const h of hits) {
      if (h.severity === "soft" && h.softFlag) flags.add(h.softFlag);
    }
    return [...flags];
  }

  private scoreToDecision(scores: Record<string, number>): {
    decision: Decision;
    reasons: HardCategory[];
  } {
    const reasons = new Set<HardCategory>();
    let decision: Decision = "allow";

    for (const [cat, score] of Object.entries(scores)) {
      if (typeof score !== "number") continue;
      const blockT = this.thresholds.BLOCK[cat];
      const queueT = this.thresholds.QUEUE[cat];
      if (blockT !== undefined && score >= blockT) {
        decision = "block";
        const mapped = CATEGORY_MAP[cat];
        if (mapped) reasons.add(mapped);
      } else if (queueT !== undefined && score >= queueT && decision !== "block") {
        decision = "queue";
        const mapped = CATEGORY_MAP[cat];
        if (mapped) reasons.add(mapped);
      }
    }
    return { decision, reasons: [...reasons] };
  }

  private buildNote(decision: Decision, reasons: HardCategory[], phraseHits: BannedPhrase[]): string {
    const parts: string[] = [`decision=${decision}`];
    if (reasons.length) parts.push(`categories=${reasons.join(",")}`);
    const softs = phraseHits.filter((h) => h.severity === "soft").map((h) => h.softFlag).join(",");
    if (softs) parts.push(`soft=${softs}`);
    return parts.join(" ");
  }
}

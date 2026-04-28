import type { Decision, HardCategory, ModerationResult, SoftFlag } from "./types.js";
import { loadBannedPhrases, type BannedPhrase } from "./bannedPhrases.js";
import { lettersOnly, normalizeForMatch } from "./textNormalize.js";
import {
  OpenAIModerationClient,
  OpenAIModerationError,
  type OpenAIModerationResultRaw,
} from "./openaiModeration.js";

/**
 * Thresholds. Conservative defaults until Pastor signs off (PASTOR_COPY_REQUIRED).
 *
 * - score >= BLOCK → block immediately, no human review.
 * - BLOCK > score >= QUEUE → human moderator review before delivery.
 */
export const DEFAULT_THRESHOLDS = {
  BLOCK: {
    sexual: 0.7,
    "sexual/minors": 0.05, // near-zero tolerance.
    harassment: 0.85,
    "harassment/threatening": 0.5,
    hate: 0.7,
    "hate/threatening": 0.4,
    "self-harm": 0.6,
    "self-harm/intent": 0.4,
    "self-harm/instructions": 0.4,
    violence: 0.85,
    "violence/graphic": 0.7,
  } as Record<string, number>,
  QUEUE: {
    sexual: 0.4,
    "sexual/minors": 0.01,
    harassment: 0.6,
    "harassment/threatening": 0.3,
    hate: 0.5,
    "hate/threatening": 0.25,
    "self-harm": 0.4,
    "self-harm/intent": 0.25,
    "self-harm/instructions": 0.25,
    violence: 0.7,
    "violence/graphic": 0.5,
  } as Record<string, number>,
};

/** Map OpenAI's category names → our HardCategory taxonomy. */
const CATEGORY_MAP: Record<string, HardCategory> = {
  sexual: "sexual",
  "sexual/minors": "sexual_minors",
  "self-harm": "self_harm",
  "self-harm/intent": "self_harm",
  "self-harm/instructions": "self_harm",
  hate: "hate",
  "hate/threatening": "hate",
  harassment: "harassment_severe",
  "harassment/threatening": "harassment_severe",
  violence: "violence_graphic",
  "violence/graphic": "violence_graphic",
};

export interface TextClassifierConfig {
  openai: OpenAIModerationClient;
  bannedPhrases?: ReadonlyArray<BannedPhrase>;
  thresholds?: typeof DEFAULT_THRESHOLDS;
  /**
   * Behavior when OpenAI is unavailable. Default 'queue': fail-closed.
   * Never default to 'allow' — that bypasses the holy guardrail.
   */
  onProviderError?: "queue" | "block";
}

export class TextClassifier {
  private readonly bannedPhrases: ReadonlyArray<BannedPhrase>;
  private readonly thresholds: typeof DEFAULT_THRESHOLDS;
  private readonly onProviderError: "queue" | "block";

  constructor(private readonly cfg: TextClassifierConfig) {
    this.bannedPhrases = loadBannedPhrases(cfg.bannedPhrases);
    this.thresholds = cfg.thresholds ?? DEFAULT_THRESHOLDS;
    this.onProviderError = cfg.onProviderError ?? "queue";
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

    // Pass 2: OpenAI moderation.
    let providerResult: OpenAIModerationResultRaw;
    try {
      providerResult = await this.cfg.openai.moderate(text);
    } catch (err) {
      if (!(err instanceof OpenAIModerationError)) throw err;
      // Fail closed.
      const decision: Decision = this.onProviderError;
      return {
        decision,
        reasons: [],
        flags: this.collectSoftFlags(phraseHits),
        rawScores: { provider_error: 1 },
        reviewerNote: `provider error: ${err.message} (fail-closed → ${decision})`,
      };
    }

    const { decision, reasons } = this.scoreToDecision(providerResult);

    return {
      decision,
      reasons,
      flags: this.collectSoftFlags(phraseHits),
      rawScores: providerResult.category_scores as unknown as Record<string, number>,
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

  private scoreToDecision(raw: OpenAIModerationResultRaw): {
    decision: Decision;
    reasons: HardCategory[];
  } {
    const scores = raw.category_scores as Record<string, number>;
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

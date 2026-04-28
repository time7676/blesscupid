import type { ImageUploadInput, ModerationResult, Decision, HardCategory } from "./types.js";

/**
 * Provider-agnostic image moderator. Default impl is a Rekognition adapter
 * (see ADR-0001). The Hive provider can be A/B-tested behind the same
 * interface later.
 *
 * Holy guardrail: every image upload that other users will see MUST be
 * routed through this before exposure.
 */
export interface ImageClassifierProvider {
  /** Returns provider-native moderation labels with confidence scores [0, 100]. */
  detectModerationLabels(input: ImageUploadInput): Promise<ProviderLabel[]>;
  /** Returns true when at least one face is detected. */
  detectFace(input: ImageUploadInput): Promise<boolean>;
}

export interface ProviderLabel {
  name: string;
  parentName?: string;
  /** 0–100. */
  confidence: number;
}

export interface ImageClassifierConfig {
  provider: ImageClassifierProvider;
  /** Default thresholds; final values owed to Pastor. */
  thresholds?: ImageThresholds;
  /** Behavior on provider error. Default 'queue'. */
  onProviderError?: "queue" | "block";
}

export interface ImageThresholds {
  /** Confidence at which we hard-block. Default 80. */
  blockAt: number;
  /** Confidence at which we queue for human review. Default 50. */
  queueAt: number;
}

const DEFAULT_THRESHOLDS: ImageThresholds = { blockAt: 80, queueAt: 50 };

/**
 * Rekognition labels we treat as hard-block (sexual / explicit).
 * Source: AWS Rekognition Detect Moderation Labels v6 hierarchy.
 */
const HARD_LABELS = new Set([
  "Explicit Nudity",
  "Nudity",
  "Graphic Male Nudity",
  "Graphic Female Nudity",
  "Sexual Activity",
  "Illustrated Explicit Nudity",
  "Adult Toys",
]);

/** Suggestive / partial — queue for human review. */
const QUEUE_LABELS = new Set([
  "Suggestive",
  "Female Swimwear Or Underwear",
  "Male Swimwear Or Underwear",
  "Partial Nudity",
  "Revealing Clothes",
  "Barechested Male",
]);

export class ImageClassifier {
  private readonly thresholds: ImageThresholds;
  private readonly onProviderError: "queue" | "block";

  constructor(private readonly cfg: ImageClassifierConfig) {
    this.thresholds = cfg.thresholds ?? DEFAULT_THRESHOLDS;
    this.onProviderError = cfg.onProviderError ?? "queue";
  }

  async classify(input: ImageUploadInput): Promise<ModerationResult> {
    let labels: ProviderLabel[];
    let face = false;
    try {
      labels = await this.cfg.provider.detectModerationLabels(input);
      if (input.isProfilePhoto) {
        face = await this.cfg.provider.detectFace(input);
      }
    } catch (err) {
      const decision: Decision = this.onProviderError;
      return {
        decision,
        reasons: [],
        flags: [],
        rawScores: { provider_error: 1 },
        reviewerNote: `image provider error: ${(err as Error).message} (fail-closed → ${decision})`,
      };
    }

    // Profile photo MUST contain a detectable face.
    if (input.isProfilePhoto && !face) {
      return {
        decision: "block",
        reasons: [],
        flags: [],
        rawScores: { face_required: 1 },
        reviewerNote: "blocked: profile photo must contain a detectable face",
      };
    }

    const reasons = new Set<HardCategory>();
    let decision: Decision = "allow";
    const scores: Record<string, number> = {};

    for (const lbl of labels) {
      scores[lbl.name] = lbl.confidence;
      if (HARD_LABELS.has(lbl.name) && lbl.confidence >= this.thresholds.blockAt) {
        decision = "block";
        reasons.add("sexual");
      } else if (
        decision !== "block" &&
        ((HARD_LABELS.has(lbl.name) && lbl.confidence >= this.thresholds.queueAt) ||
          (QUEUE_LABELS.has(lbl.name) && lbl.confidence >= this.thresholds.queueAt))
      ) {
        decision = "queue";
        reasons.add("sexual");
      }
    }

    return {
      decision,
      reasons: [...reasons],
      flags: [],
      rawScores: scores,
      reviewerNote: `image decision=${decision} labels=${labels.map((l) => `${l.name}:${l.confidence}`).join(",")}`,
    };
  }
}

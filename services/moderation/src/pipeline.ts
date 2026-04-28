import type {
  ImageUploadInput,
  MessageInput,
  ModerationResult,
  QueuedItem,
} from "./types.js";
import type { ImageClassifier } from "./imageClassifier.js";
import type { TextClassifier } from "./textClassifier.js";
import type { ModerationStore } from "./queue.js";
import { makeQueuedItem } from "./queue.js";

export interface PipelineDeps {
  text: TextClassifier;
  image: ImageClassifier;
  store: ModerationStore;
  /**
   * UUID generator. Defaults to crypto.randomUUID. Override in tests for
   * deterministic ids.
   */
  uuid?: () => string;
}

/**
 * Outcome the API hands to the chat service.
 *
 * - delivered: caller MAY persist + fan out the message.
 * - blocked: caller MUST drop. Show user-facing reason.
 * - queued: caller MUST NOT deliver yet. Send "under review" UX
 *   acknowledgement; the queue review process delivers later.
 */
export type PipelineOutcome =
  | { kind: "delivered"; result: ModerationResult }
  | { kind: "blocked"; result: ModerationResult }
  | { kind: "queued"; result: ModerationResult; queuedItem: QueuedItem };

export class ModerationPipeline {
  private readonly uuid: () => string;
  constructor(private readonly deps: PipelineDeps) {
    this.uuid = deps.uuid ?? (() => crypto.randomUUID());
  }

  async moderateMessage(input: MessageInput): Promise<PipelineOutcome> {
    if (await this.deps.store.isBlocked(input.recipientUserId, input.senderUserId)) {
      // Recipient blocked sender. Drop silently — do NOT signal to sender
      // that they were blocked (anti-harassment design).
      const result: ModerationResult = {
        decision: "block",
        reasons: [],
        flags: [],
        rawScores: { recipient_blocked_sender: 1 },
        reviewerNote: "blocked: recipient has blocked sender",
      };
      return { kind: "blocked", result };
    }

    const result = await this.deps.text.classify(input.text);
    return this.applyOutcome("text", input, result);
  }

  async moderateImage(input: ImageUploadInput): Promise<PipelineOutcome> {
    const result = await this.deps.image.classify(input);
    return this.applyOutcome("image", input, result);
  }

  private async applyOutcome(
    kind: "text" | "image",
    payload: MessageInput | ImageUploadInput,
    result: ModerationResult,
  ): Promise<PipelineOutcome> {
    if (result.decision === "allow") {
      return { kind: "delivered", result };
    }
    if (result.decision === "block") {
      // Always log blocked content too — operators need to spot-check
      // false positives. Status set to 'rejected' so it doesn't show up
      // in the live review queue.
      const item = makeQueuedItem(this.uuid(), kind, payload, result);
      const rejected: QueuedItem = {
        ...item,
        status: "rejected",
        reviewedAt: new Date().toISOString(),
        reviewerUserId: "system",
        reviewerNote: result.reviewerNote,
      };
      await this.deps.store.enqueue(rejected);
      return { kind: "blocked", result };
    }
    // queue
    const queuedItem = makeQueuedItem(this.uuid(), kind, payload, result);
    await this.deps.store.enqueue(queuedItem);
    return { kind: "queued", result, queuedItem };
  }
}

import { describe, it, expect } from "bun:test";
import { ImageClassifier, type ImageClassifierProvider, type ProviderLabel } from "../src/imageClassifier.js";
import type { ImageUploadInput } from "../src/types.js";

const sample: ImageUploadInput = {
  uploadId: "u1",
  uploaderUserId: "user-1",
  storageKey: "uploads/u1.jpg",
  isProfilePhoto: false,
};

function provider(labels: ProviderLabel[], face = true): ImageClassifierProvider {
  return {
    detectModerationLabels: async () => labels,
    detectFace: async () => face,
  };
}

describe("ImageClassifier", () => {
  it("allows clean image with no labels", async () => {
    const c = new ImageClassifier({ provider: provider([]) });
    const r = await c.classify(sample);
    expect(r.decision).toBe("allow");
  });

  it("blocks explicit nudity at high confidence", async () => {
    const c = new ImageClassifier({
      provider: provider([{ name: "Explicit Nudity", confidence: 95 }]),
    });
    const r = await c.classify(sample);
    expect(r.decision).toBe("block");
    expect(r.reasons).toContain("sexual");
  });

  it("queues suggestive image at mid confidence", async () => {
    const c = new ImageClassifier({
      provider: provider([{ name: "Suggestive", confidence: 60 }]),
    });
    const r = await c.classify(sample);
    expect(r.decision).toBe("queue");
  });

  it("blocks profile photo without a face", async () => {
    const c = new ImageClassifier({ provider: provider([], false) });
    const r = await c.classify({ ...sample, isProfilePhoto: true });
    expect(r.decision).toBe("block");
    expect(r.reviewerNote).toContain("face");
  });

  it("fails closed to queue on provider error", async () => {
    const broken: ImageClassifierProvider = {
      detectModerationLabels: async () => {
        throw new Error("rekognition down");
      },
      detectFace: async () => true,
    };
    const c = new ImageClassifier({ provider: broken });
    const r = await c.classify(sample);
    expect(r.decision).toBe("queue");
    expect(r.reviewerNote).toContain("provider error");
  });

  it("can fail closed to block on provider error when configured", async () => {
    const broken: ImageClassifierProvider = {
      detectModerationLabels: async () => {
        throw new Error("rekognition down");
      },
      detectFace: async () => true,
    };
    const c = new ImageClassifier({ provider: broken, onProviderError: "block" });
    const r = await c.classify(sample);
    expect(r.decision).toBe("block");
  });
});

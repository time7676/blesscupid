import { describe, it, expect } from "bun:test";
import { ModerationPipeline } from "../src/pipeline.js";
import { TextClassifier } from "../src/textClassifier.js";
import { ImageClassifier, type ImageClassifierProvider } from "../src/imageClassifier.js";
import { InMemoryModerationStore, makeReport } from "../src/queue.js";
import type { MessageInput, ImageUploadInput } from "../src/types.js";

function fakeImageProvider(): ImageClassifierProvider {
  return {
    detectModerationLabels: async () => [{ name: "Explicit Nudity", confidence: 95 }],
    detectFace: async () => true,
  };
}

function fakeBenignImageProvider(): ImageClassifierProvider {
  return {
    detectModerationLabels: async () => [],
    detectFace: async () => true,
  };
}

function makeMessage(text: string, recipient = "alice", sender = "bob"): MessageInput {
  return {
    threadId: "t1",
    senderUserId: sender,
    recipientUserId: recipient,
    text,
    sentAt: "2026-04-28T12:00:00Z",
  };
}

let counter = 0;
const detUuid = () => `id-${++counter}`;

function build() {
  counter = 0;
  const store = new InMemoryModerationStore();
  return {
    store,
    pipeline: new ModerationPipeline({
      store,
      text: new TextClassifier({}),
      image: new ImageClassifier({ provider: fakeBenignImageProvider() }),
      uuid: detUuid,
    }),
  };
}

describe("ModerationPipeline — text", () => {
  it("delivers benign message", async () => {
    const { pipeline } = build();
    const out = await pipeline.moderateMessage(makeMessage("how was your church retreat?"));
    expect(out.kind).toBe("delivered");
  });

  it("blocks message with hard banned phrase and logs to store as rejected", async () => {
    const { pipeline, store } = build();
    const out = await pipeline.moderateMessage(makeMessage("send nudes please"));
    expect(out.kind).toBe("blocked");
    const pending = await store.listPending();
    expect(pending).toHaveLength(0); // rejected, not pending
    const item = await store.get("id-1");
    expect(item?.status).toBe("rejected");
  });

  it("queues borderline message and does NOT deliver", async () => {
    const store = new InMemoryModerationStore();
    const pipeline = new ModerationPipeline({
      store,
      text: new TextClassifier({
        thresholds: {
          BLOCK: { sexual: 0.9, sexual_minors: 0.05, harassment_severe: 0.9, hate: 0.9, self_harm: 0.9, violence_graphic: 0.9 },
          QUEUE: { sexual: 0.4, sexual_minors: 0.01, harassment_severe: 0.3, hate: 0.5, self_harm: 0.4, violence_graphic: 0.5 },
        },
      }),
      image: new ImageClassifier({ provider: fakeBenignImageProvider() }),
      uuid: detUuid,
    });
    counter = 0;
    const out = await pipeline.moderateMessage(makeMessage("fuck"));
    expect(out.kind).toBe("queued");
    const pending = await store.listPending();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.kind).toBe("text");
  });

  it("blocks delivery when recipient has blocked sender (silent)", async () => {
    const { pipeline, store } = build();
    await store.block({ blockerUserId: "alice", blockedUserId: "bob", createdAt: "2026-04-28T11:00:00Z" });
    const out = await pipeline.moderateMessage(makeMessage("hi alice", "alice", "bob"));
    expect(out.kind).toBe("blocked");
    expect(out.result.reviewerNote).toContain("recipient has blocked sender");
  });
});

describe("ModerationPipeline — image", () => {
  it("rejects nude profile photo and logs", async () => {
    const store = new InMemoryModerationStore();
    const pipeline = new ModerationPipeline({
      store,
      text: new TextClassifier({}),
      image: new ImageClassifier({ provider: fakeImageProvider() }),
      uuid: detUuid,
    });
    counter = 0;
    const input: ImageUploadInput = {
      uploadId: "u1",
      uploaderUserId: "bob",
      storageKey: "uploads/u1.jpg",
      isProfilePhoto: true,
    };
    const out = await pipeline.moderateImage(input);
    expect(out.kind).toBe("blocked");
    const item = await store.get("id-1");
    expect(item?.status).toBe("rejected");
    expect(item?.kind).toBe("image");
  });
});

describe("Reports + blocks", () => {
  it("records report and surfaces it for the reported user", async () => {
    const store = new InMemoryModerationStore();
    await store.recordReport(
      makeReport({
        id: "r1",
        reporterUserId: "alice",
        reportedUserId: "bob",
        reason: "harassment",
        threadId: "t1",
        messageId: "m1",
      }),
    );
    const reports = await store.reportsForUser("bob");
    expect(reports).toHaveLength(1);
    expect(reports[0]?.reason).toBe("harassment");
  });

  it("block + isBlocked + unblock round-trip", async () => {
    const store = new InMemoryModerationStore();
    await store.block({ blockerUserId: "alice", blockedUserId: "bob", createdAt: "2026-04-28T11:00:00Z" });
    expect(await store.isBlocked("alice", "bob")).toBe(true);
    expect(await store.isBlocked("bob", "alice")).toBe(false);
    await store.unblock("alice", "bob");
    expect(await store.isBlocked("alice", "bob")).toBe(false);
  });

  it("queue resolve is idempotent", async () => {
    const store = new InMemoryModerationStore();
    const { ModerationPipeline: _MP } = await import("../src/pipeline.js");
    const pipeline = new ModerationPipeline({
      store,
      text: new TextClassifier({
        thresholds: {
          BLOCK: { sexual: 0.9, sexual_minors: 0.05, harassment_severe: 0.9, hate: 0.9, self_harm: 0.9, violence_graphic: 0.9 },
          QUEUE: { sexual: 0.4, sexual_minors: 0.01, harassment_severe: 0.3, hate: 0.5, self_harm: 0.4, violence_graphic: 0.5 },
        },
      }),
      image: new ImageClassifier({ provider: fakeBenignImageProvider() }),
      uuid: detUuid,
    });
    counter = 0;
    const out = await pipeline.moderateMessage(makeMessage("fuck"));
    expect(out.kind).toBe("queued");
    if (out.kind !== "queued") throw new Error("type narrow");
    const a = await store.resolve(out.queuedItem.id, "approved", "pastor-1");
    expect(a?.status).toBe("approved");
    const b = await store.resolve(out.queuedItem.id, "rejected", "pastor-2");
    expect(b?.status).toBe("approved"); // idempotent — first decision sticks
  });
});

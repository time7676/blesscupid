import { describe, it, expect } from "vitest";
import {
  expressInterest,
  canChat,
  InMemoryInterestStore,
  RecordingNotifier,
} from "../src/mutual-interest.js";

describe("mutual interest gate", () => {
  it("does not unlock chat after one-sided interest", async () => {
    const store = new InMemoryInterestStore();
    const notifier = new RecordingNotifier();
    const r = await expressInterest("a", "b", store, notifier);
    expect(r.mutual).toBe(false);
    expect(r.chatUnlockedAt).toBeNull();
    expect(await canChat("a", "b", store)).toBe(false);
    expect(notifier.sent).toHaveLength(0);
  });

  it("unlocks chat and notifies both sides on mutual interest", async () => {
    const store = new InMemoryInterestStore();
    const notifier = new RecordingNotifier();
    await expressInterest("a", "b", store, notifier);
    const r = await expressInterest("b", "a", store, notifier);
    expect(r.mutual).toBe(true);
    expect(r.chatUnlockedAt).not.toBeNull();
    expect(await canChat("a", "b", store)).toBe(true);
    expect(notifier.sent).toHaveLength(2);
    const recipients = notifier.sent.map((n) => n.forUserId).sort();
    expect(recipients).toEqual(["a", "b"]);
  });

  it("rejects self-interest", async () => {
    const store = new InMemoryInterestStore();
    const notifier = new RecordingNotifier();
    await expect(expressInterest("a", "a", store, notifier)).rejects.toThrow(
      /self/i,
    );
  });

  it("is idempotent on repeated interest from same user", async () => {
    const store = new InMemoryInterestStore();
    const notifier = new RecordingNotifier();
    await expressInterest("a", "b", store, notifier);
    await expressInterest("a", "b", store, notifier);
    expect(notifier.sent).toHaveLength(0);
    await expressInterest("b", "a", store, notifier);
    expect(notifier.sent).toHaveLength(2);
    // A 4th call (b->a again) should not create a second match.
    await expressInterest("b", "a", store, notifier);
    expect(notifier.sent).toHaveLength(2);
  });
});

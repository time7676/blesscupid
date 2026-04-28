import { describe, it, expect } from "bun:test";
import { TextClassifier } from "../src/textClassifier.js";
import { OpenAIModerationClient, OpenAIModerationError, type OpenAIModerationApiResponse } from "../src/openaiModeration.js";

function fakeOpenAI(scores: Record<string, number>): OpenAIModerationClient {
  const payload: OpenAIModerationApiResponse = {
    id: "test",
    model: "test",
    results: [
      {
        flagged: Object.values(scores).some((v) => v > 0.5),
        categories: Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, v > 0.5])),
        category_scores: scores as never,
      },
    ],
  };
  const fetchImpl = (async () => ({
    ok: true,
    status: 200,
    json: async () => payload,
  })) as unknown as typeof fetch;
  return new OpenAIModerationClient({ apiKey: "test", fetchImpl });
}

function failingOpenAI(): OpenAIModerationClient {
  const fetchImpl = (async () => ({
    ok: false,
    status: 500,
    json: async () => ({}),
  })) as unknown as typeof fetch;
  return new OpenAIModerationClient({ apiKey: "test", fetchImpl });
}

describe("TextClassifier", () => {
  it("allows benign text with all scores below queue threshold", async () => {
    const cls = new TextClassifier({ openai: fakeOpenAI({ sexual: 0.01, harassment: 0.02 }) });
    const r = await cls.classify("Hi, would you like to grab coffee after Sunday service?");
    expect(r.decision).toBe("allow");
    expect(r.reasons).toEqual([]);
    expect(r.flags).toEqual([]);
  });

  it("blocks on hard banned phrase before calling provider", async () => {
    const cls = new TextClassifier({ openai: failingOpenAI() });
    const r = await cls.classify("please send nudes");
    expect(r.decision).toBe("block");
    expect(r.reasons).toContain("sexual");
  });

  it("flags off-platform-pressure soft phrases but still allows", async () => {
    const cls = new TextClassifier({ openai: fakeOpenAI({ sexual: 0.01 }) });
    const r = await cls.classify("Let's meet today at 8pm");
    expect(r.decision).toBe("allow");
    expect(r.flags).toContain("off_platform_pressure");
  });

  it("flags photo_request when 'send me a pic' appears", async () => {
    const cls = new TextClassifier({ openai: fakeOpenAI({ sexual: 0.05 }) });
    const r = await cls.classify("hey, send me a pic of you");
    expect(r.decision).toBe("allow");
    expect(r.flags).toContain("photo_request");
  });

  it("queues when provider score crosses queue threshold but not block", async () => {
    const cls = new TextClassifier({ openai: fakeOpenAI({ sexual: 0.5 }) });
    const r = await cls.classify("borderline text");
    expect(r.decision).toBe("queue");
    expect(r.reasons).toContain("sexual");
  });

  it("blocks when provider score crosses block threshold", async () => {
    const cls = new TextClassifier({ openai: fakeOpenAI({ sexual: 0.95 }) });
    const r = await cls.classify("clearly explicit");
    expect(r.decision).toBe("block");
    expect(r.reasons).toContain("sexual");
  });

  it("near-zero tolerance for sexual/minors — queue at 0.02, block at 0.06", async () => {
    const cls = new TextClassifier({ openai: fakeOpenAI({ "sexual/minors": 0.02 }) });
    const r1 = await cls.classify("x");
    expect(r1.decision).toBe("queue");
    const cls2 = new TextClassifier({ openai: fakeOpenAI({ "sexual/minors": 0.06 }) });
    const r2 = await cls2.classify("x");
    expect(r2.decision).toBe("block");
  });

  it("fail-closed to queue on provider error (default)", async () => {
    const cls = new TextClassifier({ openai: failingOpenAI() });
    const r = await cls.classify("totally benign");
    expect(r.decision).toBe("queue");
    expect(r.reviewerNote).toContain("provider error");
  });

  it("can fail-closed to block when configured", async () => {
    const cls = new TextClassifier({ openai: failingOpenAI(), onProviderError: "block" });
    const r = await cls.classify("totally benign");
    expect(r.decision).toBe("block");
  });

  it("OpenAIModerationError is thrown on non-200 in client", async () => {
    const client = failingOpenAI();
    await expect(client.moderate("x")).rejects.toBeInstanceOf(OpenAIModerationError);
  });

  it("normalizes obfuscated banned phrases", async () => {
    const cls = new TextClassifier({ openai: fakeOpenAI({ sexual: 0.01 }) });
    const r = await cls.classify("s.e.n.d  n u d e s please");
    expect(r.decision).toBe("block");
  });
});

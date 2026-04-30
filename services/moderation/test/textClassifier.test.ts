import { describe, it, expect } from "bun:test";
import { TextClassifier } from "../src/textClassifier.js";

describe("TextClassifier rule-based engine", () => {
  it("allows benign text", async () => {
    const cls = new TextClassifier({});
    const r = await cls.classify("Hi, would you like to grab coffee after Sunday service?");
    expect(r.decision).toBe("allow");
    expect(r.reasons).toEqual([]);
    expect(r.flags).toEqual([]);
  });

  it("blocks hard banned phrases immediately", async () => {
    const cls = new TextClassifier({});
    const r = await cls.classify("please send nudes");
    expect(r.decision).toBe("block");
    expect(r.reasons).toContain("sexual");
  });

  it("flags off-platform soft phrases but allows", async () => {
    const cls = new TextClassifier({});
    const r = await cls.classify("Let's meet today at 8pm");
    expect(r.decision).toBe("allow");
    expect(r.flags).toContain("off_platform_pressure");
  });

  it("flags photo_request soft phrase", async () => {
    const cls = new TextClassifier({});
    const r = await cls.classify("hey, send me a pic of you");
    expect(r.decision).toBe("allow");
    expect(r.flags).toContain("photo_request");
  });

  it("blocks explicit sexual rule patterns", async () => {
    const cls = new TextClassifier({});
    const r = await cls.classify("im so horny right now");
    expect(r.decision).toBe("block");
    expect(r.reasons).toContain("sexual");
  });

  it("blocks hate speech patterns", async () => {
    const cls = new TextClassifier({});
    const r = await cls.classify("god hates you bible thumper");
    expect(r.decision).toBe("block");
    expect(r.reasons).toContain("hate");
  });

  it("blocks self-harm signals", async () => {
    const cls = new TextClassifier({});
    const r = await cls.classify("i want to cut myself tonight");
    expect(r.decision).toBe("block");
    expect(r.reasons).toContain("self_harm");
  });

  it("normalizes obfuscated banned phrases", async () => {
    const cls = new TextClassifier({});
    const r = await cls.classify("s.e.n.d  n u d e s please");
    expect(r.decision).toBe("block");
  });
});

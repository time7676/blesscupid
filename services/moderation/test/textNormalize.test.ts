import { describe, it, expect } from "bun:test";
import { normalizeForMatch } from "../src/textNormalize.js";

describe("normalizeForMatch", () => {
  it("lowercases and trims", () => {
    expect(normalizeForMatch("  Hello WORLD  ")).toBe("hello world");
  });

  it("strips accents", () => {
    expect(normalizeForMatch("café résumé")).toBe("cafe resume");
  });

  it("collapses letter-splitting punctuation", () => {
    expect(normalizeForMatch("s.e.x")).toBe("sex");
    expect(normalizeForMatch("s e x")).toBe("sex");
    expect(normalizeForMatch("s_e_x")).toBe("sex");
    expect(normalizeForMatch("s-e-x")).toBe("sex");
    expect(normalizeForMatch("s*e*x")).toBe("sex");
  });

  it("handles fullwidth unicode", () => {
    expect(normalizeForMatch("ＳＥＸ")).toBe("sex");
  });

  it("strips zero-width characters", () => {
    expect(normalizeForMatch("h​e​llo")).toBe("hello");
  });
});

/**
 * Normalize text for banned-phrase matching.
 *
 * - NFKD decomposes compatibility forms + accents so combining marks can be
 *   stripped (NFKC alone leaves precomposed chars like "é").
 * - Lowercase, strip diacritics + zero-width controls, collapse whitespace.
 * - Collapse obfuscation runs of the shape `s.e.x` / `s e x` (3+ letters
 *   each separated by punctuation/space) into solid words. Normal prose with
 *   single-letter words ("a") is untouched because the run requires 3+ pairs.
 *
 * This is deliberately conservative; produced false positives still get a
 * sanity check from the OpenAI classifier downstream.
 */
export function normalizeForMatch(input: string): string {
  let s = input.normalize("NFKD").toLowerCase();
  s = s.replace(/\p{M}+/gu, "");
  s = s.replace(/[​-‏‪-‮⁠-⁤­]/g, "");
  s = s.replace(/(\b[a-z](?:[\s._\-*]+[a-z]){2,}\b)/g, (run) =>
    run.replace(/[\s._\-*]+/g, ""),
  );
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/**
 * Letters-only fallback form. Catches obfuscation that crosses word
 * boundaries (e.g. "s.e.n.d  n u d e s" → "sendnudes"). Banned-phrase
 * matching checks both `normalizeForMatch` and `lettersOnly` of the input
 * against the same transforms of each needle.
 */
export function lettersOnly(input: string): string {
  return normalizeForMatch(input).replace(/[^a-z]/g, "");
}

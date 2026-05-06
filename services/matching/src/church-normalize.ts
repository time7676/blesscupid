/**
 * Home-church name normalization for the same-church bonus in scoring.
 *
 * Per plan auto-amend (line 1141): lowercase + NFKC + strip punct +
 * collapse whitespace. Lat/lng remains primary signal — the string match
 * only contributes when the two churches are within `CHURCH_NEAR_KM` AND
 * the normalized strings are equal.
 *
 * Pure function. No I/O.
 */

const PUNCT_RE = /[\p{P}\p{S}]+/gu;
const WS_RE = /\s+/g;

export function normalize(name: string): string {
  if (!name) return "";
  // 1. Unicode-normalize so e.g. "Café" + "Café" collapse.
  const nfkc = name.normalize("NFKC");
  // 2. Lowercase.
  const lower = nfkc.toLocaleLowerCase("en-US");
  // 3. Strip punctuation and symbols.
  const stripped = lower.replace(PUNCT_RE, " ");
  // 4. Collapse whitespace.
  return stripped.replace(WS_RE, " ").trim();
}

/** True iff both names are non-empty and normalize identically. */
export function sameChurchName(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  return na === nb;
}

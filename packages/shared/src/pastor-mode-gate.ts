// BLE-136 — Pastor-mode 18+ gate primitives.
//
// Server-side gate is the source of truth. These primitives are reusable
// across other 18+ surfaces: NIK→DOB extraction, neutral-fail copy,
// telemetry event names, and the doctrinal cooldown window.
//
// HARD RULES (BLE-130 spec):
//   - Single neutral-fail surface — no shame framing, no leak between
//     under-18 / OCR fail / doc-quality fail / affidavit refused.
//   - 24h cooldown after neutral-fail. No retry-from-failure within window.
//   - Zero PII in telemetry. NIK and raw DOB never leave the device-trust
//     boundary unencrypted, and never enter the admin telemetry surface.
//   - Doormat metaphor (Wahyu 3:20) used exactly once on the intro surface.
//     Reuse as urgency/shame copy is forbidden.

import { MINIMUM_AGE, ageFromDob, checkAgeGate, type AgeGateResult } from './age-gate.js';

export const PASTOR_MODE_GATE_VERSION = '2026-04-29';

// User-facing message. Indonesian (TB2 register), neutral-fail framing.
// Same exact copy for ALL failure modes. Do not branch on reason.
export const PASTOR_MODE_NEUTRAL_FAIL_ID = 'pastor_mode.neutral_fail';
export const PASTOR_MODE_NEUTRAL_FAIL_COPY =
  'Mode Pastor tersedia untuk pengguna 18+. Lanjutkan pakai akun reguler.';

// 24h cooldown after a neutral-fail. Doctrinal: the gate is a doormat,
// not a stress test. Repeated taps within the window get the same neutral
// surface — never a different one.
export const PASTOR_MODE_GATE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

// Telemetry events. Aggregate-only; no userId, no IP, no DOB, no NIK in body.
// Admin dashboard tile reads counts, never rows.
export const PASTOR_MODE_GATE_TELEMETRY_EVENTS = {
  surface_viewed_intro: 'pastor_mode_gate.surface_viewed.intro',
  surface_viewed_ktp_capture: 'pastor_mode_gate.surface_viewed.ktp_capture',
  surface_viewed_dob_review: 'pastor_mode_gate.surface_viewed.dob_review',
  surface_viewed_affidavit: 'pastor_mode_gate.surface_viewed.affidavit',
  surface_viewed_processing: 'pastor_mode_gate.surface_viewed.processing',
  surface_viewed_pass: 'pastor_mode_gate.surface_viewed.pass',
  surface_viewed_neutral_fail: 'pastor_mode_gate.surface_viewed.neutral_fail',
  decision_pass: 'pastor_mode_gate.decision.pass',
  decision_neutral_fail: 'pastor_mode_gate.decision.neutral_fail',
} as const;

export type PastorModeGateTelemetryEvent =
  (typeof PASTOR_MODE_GATE_TELEMETRY_EVENTS)[keyof typeof PASTOR_MODE_GATE_TELEMETRY_EVENTS];

// Internal reason codes. Used for ops triage on the audit table only.
// MUST NEVER be surfaced to the user, mapped to a copy variant, or
// returned in the public verify response. Server collapses all of these
// to the same neutral-fail outcome before responding.
export const PASTOR_MODE_INTERNAL_REASONS = {
  underage: 'underage',
  invalid_dob: 'invalid_dob',
  future_dob: 'future_dob',
  ktp_ocr_low_confidence: 'ktp_ocr_low_confidence',
  doc_quality: 'doc_quality',
  affidavit_declined: 'affidavit_declined',
  cooldown_active: 'cooldown_active',
  liveness_failed: 'liveness_failed',
} as const;

export type PastorModeInternalReason =
  (typeof PASTOR_MODE_INTERNAL_REASONS)[keyof typeof PASTOR_MODE_INTERNAL_REASONS];

// Public response shape. Server returns this regardless of reason. Client
// MUST NOT branch on the absence/presence of fields beyond `passed`.
export type PastorModeVerifyResponse = {
  passed: boolean;
  // ISO timestamp; only set when passed=true. When passed=false, this
  // field is OMITTED — clients must not interpret its absence as anything
  // other than "see neutral-fail surface".
  passedAt?: string;
  // Same neutral-fail message id for ALL failures. Client looks up the
  // localized string from this id; no second message channel.
  messageId?: typeof PASTOR_MODE_NEUTRAL_FAIL_ID;
};

// === KTP NIK parsing ====================================================
//
// Indonesian KTP NIK = 16 digits:
//   [PP][KK][KC][DDMMYY][SSSS]
//   PP   = province (2)
//   KK   = regency (2)
//   KC   = sub-district (2)
//   DDMMYY = DOB. For females, DD has +40 added (so 1 → 41, 31 → 71).
//   SSSS = sequence within DOB+area (4)
//
// Century: NIK gives 2-digit year. Resolve by: if YY > current 2-digit year,
// it's 19YY; else 20YY. We tighten this with a sanity check against the
// 18+ age cutoff — anything that would imply >120 yrs old is invalid.
//
// We DO NOT store NIK on the server. The client extracts NIK locally from
// the captured KTP image, sends only the resolved DOB to the server. The
// server still validates the 16-digit checksum-shape so a malicious client
// cannot bypass.

export const KTP_NIK_LENGTH = 16;
const NIK_RE = /^\d{16}$/;

export type ParsedNik = {
  provinceCode: string;
  regencyCode: string;
  subdistrictCode: string;
  dobIso: string;
  gender: 'male' | 'female';
  sequence: string;
};

export type NikParseFailure = {
  ok: false;
  reason: 'invalid_length' | 'invalid_chars' | 'invalid_dob' | 'implausible_age';
};
export type NikParseSuccess = { ok: true; parsed: ParsedNik };
export type NikParseResult = NikParseSuccess | NikParseFailure;

const MAX_PLAUSIBLE_AGE = 120;

export function parseNik(nik: string, now: Date = new Date()): NikParseResult {
  const trimmed = nik.replace(/\s+/g, '');
  if (trimmed.length !== KTP_NIK_LENGTH) return { ok: false, reason: 'invalid_length' };
  if (!NIK_RE.test(trimmed)) return { ok: false, reason: 'invalid_chars' };

  const provinceCode = trimmed.slice(0, 2);
  const regencyCode = trimmed.slice(2, 4);
  const subdistrictCode = trimmed.slice(4, 6);
  const ddRaw = parseInt(trimmed.slice(6, 8), 10);
  const mm = parseInt(trimmed.slice(8, 10), 10);
  const yy = parseInt(trimmed.slice(10, 12), 10);
  const sequence = trimmed.slice(12, 16);

  const gender: 'male' | 'female' = ddRaw > 40 ? 'female' : 'male';
  const dd = gender === 'female' ? ddRaw - 40 : ddRaw;

  if (dd < 1 || dd > 31) return { ok: false, reason: 'invalid_dob' };
  if (mm < 1 || mm > 12) return { ok: false, reason: 'invalid_dob' };

  // Century resolution. Two-digit year on KTP — 1900s vs 2000s.
  // Prefer the most-recent plausible interpretation under 120 years old.
  const nowYY = now.getUTCFullYear() % 100;
  const fullYear = yy <= nowYY ? 2000 + yy : 1900 + yy;
  const dob = new Date(Date.UTC(fullYear, mm - 1, dd));
  // Round-trip check catches Feb 30, etc.
  if (
    dob.getUTCFullYear() !== fullYear ||
    dob.getUTCMonth() !== mm - 1 ||
    dob.getUTCDate() !== dd
  ) {
    return { ok: false, reason: 'invalid_dob' };
  }
  if (dob.getTime() > now.getTime()) return { ok: false, reason: 'invalid_dob' };
  if (ageFromDob(dob, now) > MAX_PLAUSIBLE_AGE) {
    return { ok: false, reason: 'implausible_age' };
  }

  return {
    ok: true,
    parsed: {
      provinceCode,
      regencyCode,
      subdistrictCode,
      dobIso: dob.toISOString().slice(0, 10),
      gender,
      sequence,
    },
  };
}

// Convenience for callers that only want pass/fail without exposing the
// raw NIK details. Maps to the existing checkAgeGate primitive so the
// 18+ threshold lives in exactly one place (MINIMUM_AGE).
export function evaluateKtpDob(dobIso: string, now: Date = new Date()): AgeGateResult {
  return checkAgeGate(dobIso, now);
}

// Re-export so callers don't pull from two modules.
export { MINIMUM_AGE };

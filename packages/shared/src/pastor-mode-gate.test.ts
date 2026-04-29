import { describe, it, expect } from 'vitest';
import {
  parseNik,
  evaluateKtpDob,
  PASTOR_MODE_NEUTRAL_FAIL_COPY,
  PASTOR_MODE_NEUTRAL_FAIL_ID,
  PASTOR_MODE_GATE_COOLDOWN_MS,
  PASTOR_MODE_GATE_TELEMETRY_EVENTS,
  PASTOR_MODE_INTERNAL_REASONS,
  KTP_NIK_LENGTH,
  MINIMUM_AGE,
} from './pastor-mode-gate.js';

describe('parseNik', () => {
  const NOW = new Date('2026-04-29T00:00:00Z');

  it('parses a male NIK with DOB in 1990', () => {
    // 32 71 01 280790 0001 — male, 1990-07-28
    const r = parseNik('3271012807900001', NOW);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.parsed.dobIso).toBe('1990-07-28');
      expect(r.parsed.gender).toBe('male');
      expect(r.parsed.provinceCode).toBe('32');
    }
  });

  it('parses a female NIK with DD+40 offset', () => {
    // 32 71 01 681290 0002 — female, 1990-12-28 (28+40=68)
    const r = parseNik('3271016812900002', NOW);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.parsed.dobIso).toBe('1990-12-28');
      expect(r.parsed.gender).toBe('female');
    }
  });

  it('resolves century: yy <= current yy goes to 2000s', () => {
    // 2026 -> nowYY=26. yy=10 -> 2010.
    const r = parseNik('3271011001100001', NOW);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.parsed.dobIso).toBe('2010-01-10');
  });

  it('resolves century: yy > current yy goes to 1900s', () => {
    // yy=99 -> 1999 (since 99 > 26).
    const r = parseNik('3271012807990001', NOW);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.parsed.dobIso).toBe('1999-07-28');
  });

  it('rejects wrong length', () => {
    const r = parseNik('327101280790000', NOW);
    expect(r).toEqual({ ok: false, reason: 'invalid_length' });
  });

  it('rejects non-digit chars', () => {
    const r = parseNik('327101280790000A', NOW);
    expect(r).toEqual({ ok: false, reason: 'invalid_chars' });
  });

  it('rejects impossible day (Feb 30 round-trip)', () => {
    // 32 71 01 30 02 90 0001 — Feb 30 1990
    const r = parseNik('3271013002900001', NOW);
    expect(r).toEqual({ ok: false, reason: 'invalid_dob' });
  });

  it('rejects month > 12', () => {
    const r = parseNik('3271010113900001', NOW);
    expect(r).toEqual({ ok: false, reason: 'invalid_dob' });
  });

  it('strips whitespace before parsing', () => {
    const r = parseNik('3271 0128 0790 0001', NOW);
    expect(r.ok).toBe(true);
  });
});

describe('evaluateKtpDob', () => {
  const NOW = new Date('2026-04-29T00:00:00Z');

  it('passes a 25-year-old', () => {
    const r = evaluateKtpDob('2000-04-29', NOW);
    expect(r.ok).toBe(true);
  });

  it('rejects under-18', () => {
    const r = evaluateKtpDob('2009-05-01', NOW);
    expect(r).toEqual({ ok: false, reason: 'underage' });
  });

  it('rejects exactly 17yo on day before 18th birthday', () => {
    const r = evaluateKtpDob('2008-04-30', NOW);
    expect(r).toEqual({ ok: false, reason: 'underage' });
  });

  it('passes exactly 18yo on the 18th birthday', () => {
    const r = evaluateKtpDob('2008-04-29', NOW);
    expect(r.ok).toBe(true);
  });
});

describe('hard rules — invariants the rest of the system depends on', () => {
  it('neutral-fail copy mentions "18+" and stays neutral (no shame)', () => {
    expect(PASTOR_MODE_NEUTRAL_FAIL_COPY).toContain('18+');
    expect(PASTOR_MODE_NEUTRAL_FAIL_COPY.toLowerCase()).not.toContain('gagal');
    expect(PASTOR_MODE_NEUTRAL_FAIL_COPY.toLowerCase()).not.toContain('failed');
    expect(PASTOR_MODE_NEUTRAL_FAIL_COPY.toLowerCase()).not.toContain('error');
  });

  it('cooldown is 24 hours exactly', () => {
    expect(PASTOR_MODE_GATE_COOLDOWN_MS).toBe(24 * 60 * 60 * 1000);
  });

  it('NIK length is 16', () => {
    expect(KTP_NIK_LENGTH).toBe(16);
  });

  it('minimum age threshold is 18', () => {
    expect(MINIMUM_AGE).toBe(18);
  });

  it('every internal reason is a string (audit-only, never user-facing)', () => {
    for (const v of Object.values(PASTOR_MODE_INTERNAL_REASONS)) {
      expect(typeof v).toBe('string');
    }
  });

  it('telemetry event names follow the aggregate `pastor_mode_gate.*` prefix', () => {
    // Names describe surfaces and decisions, not user data. The PII-free
    // invariant is enforced at the write boundary (service emits counts,
    // never identifiers). Surface name "dob_review" is a screen label,
    // not a payload field.
    for (const name of Object.values(PASTOR_MODE_GATE_TELEMETRY_EVENTS)) {
      expect(name).toMatch(/^pastor_mode_gate\.[a-z_.]+$/);
      expect(name).not.toMatch(/\b(userId|sessionId|nik|email|ip)\b/);
    }
  });

  it('neutral-fail message id is referenced by the copy lookup channel', () => {
    expect(PASTOR_MODE_NEUTRAL_FAIL_ID).toBe('pastor_mode.neutral_fail');
  });
});

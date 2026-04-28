import { describe, it, expect } from 'vitest';
import { ageFromDob, isAdult, checkAgeGate, MINIMUM_AGE } from './age-gate.js';

describe('ageFromDob', () => {
  it('exact birthday returns full year', () => {
    expect(ageFromDob(new Date('2000-04-28'), new Date('2026-04-28'))).toBe(26);
  });

  it('day before birthday returns prior year', () => {
    expect(ageFromDob(new Date('2000-04-29'), new Date('2026-04-28'))).toBe(25);
  });
});

describe('isAdult', () => {
  it('17yo blocked', () => {
    const dob = new Date('2009-04-29');
    expect(isAdult(dob, new Date('2026-04-28'))).toBe(false);
  });

  it('18yo on birthday allowed', () => {
    const dob = new Date('2008-04-28');
    expect(isAdult(dob, new Date('2026-04-28'))).toBe(true);
  });

  it('threshold matches MINIMUM_AGE constant', () => {
    expect(MINIMUM_AGE).toBe(18);
  });
});

describe('checkAgeGate', () => {
  it('rejects underage', () => {
    expect(checkAgeGate('2010-01-01', new Date('2026-04-28'))).toEqual({
      ok: false,
      reason: 'underage',
    });
  });

  it('rejects future dob', () => {
    expect(checkAgeGate('2099-01-01', new Date('2026-04-28'))).toEqual({
      ok: false,
      reason: 'future_dob',
    });
  });

  it('rejects invalid dob', () => {
    expect(checkAgeGate('not-a-date', new Date('2026-04-28'))).toEqual({
      ok: false,
      reason: 'invalid_dob',
    });
  });

  it('allows adult', () => {
    expect(checkAgeGate('1990-04-28', new Date('2026-04-28'))).toEqual({
      ok: true,
      age: 36,
    });
  });
});

export const MINIMUM_AGE = 18;

export function ageFromDob(dob: Date, now: Date = new Date()): number {
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const m = now.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }
  return age;
}

export function isAdult(dob: Date, now: Date = new Date()): boolean {
  return ageFromDob(dob, now) >= MINIMUM_AGE;
}

export type AgeGateOk = { ok: true; age: number };
export type AgeGateFail = { ok: false; reason: 'underage' | 'invalid_dob' | 'future_dob' };
export type AgeGateResult = AgeGateOk | AgeGateFail;

export function checkAgeGate(dobIso: string, now: Date = new Date()): AgeGateResult {
  const dob = new Date(dobIso);
  if (Number.isNaN(dob.getTime())) return { ok: false, reason: 'invalid_dob' };
  if (dob.getTime() > now.getTime()) return { ok: false, reason: 'future_dob' };
  const age = ageFromDob(dob, now);
  if (age < MINIMUM_AGE) return { ok: false, reason: 'underage' };
  return { ok: true, age };
}

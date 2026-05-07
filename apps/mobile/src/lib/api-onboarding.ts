// BlessCupid v1 mobile-side onboarding API client.
//
// Wraps /v1/onboarding/* endpoints. Uses the shared `apiFetch` helper that
// auto-attaches the Bearer token from auth-store.
//
// Server contract (from apps/api/src/onboarding/):
//   GET  /v1/onboarding/state        → { currentStep, capturedFields, isComplete }
//   POST /v1/onboarding/step/:n      → { currentStep, isComplete }
//   POST /v1/onboarding/q3-reject    → 200 (User row hard-deleted server-side)
//   POST /v1/onboarding/complete     → { onboardingCompleted: true }
//
// Server returns 409 `{ error: 'q3_redirect_required' }` from step 4 when
// gender === seeking. The OnboardingFlow re-throws as `{ code: 'q3_redirect_required' }`
// so the UI can show the Q3 sheet.

import { apiFetch } from './api.js';

export interface OnboardingState {
  currentStep: number;       // 0-8 (0 = no step saved yet)
  capturedFields: Record<string, unknown>;
  isComplete: boolean;
}

export async function fetchOnboardingState(): Promise<OnboardingState> {
  return apiFetch('/v1/onboarding/state', { method: 'GET' });
}

export async function saveOnboardingStep(n: number, body: unknown): Promise<{ currentStep: number; isComplete: boolean }> {
  try {
    return await apiFetch(`/v1/onboarding/step/${n}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    });
  } catch (e: any) {
    // Surface Q3 redirect as a structured code so UI can branch.
    const errCode = e?.body?.error ?? e?.error;
    if (errCode === 'q3_redirect_required') {
      const err = new Error('q3_redirect_required');
      (err as any).code = 'q3_redirect_required';
      throw err;
    }
    throw e;
  }
}

export async function q3HardReject(): Promise<void> {
  await apiFetch('/v1/onboarding/q3-reject', { method: 'POST' });
}

export async function completeOnboarding(): Promise<{ onboardingCompleted: boolean }> {
  return apiFetch('/v1/onboarding/complete', { method: 'POST' });
}

// Card 7 verse picker — pulls 12 suggestions from the curated 84-pool,
// optionally filtered by user's whimsicalAnswers-so-far for affinity.
export interface VerseChoice {
  ref: string;
  text: string;
  attribution: string;
}

export async function fetchVerseSuggestions(): Promise<VerseChoice[]> {
  const res = await apiFetch<{ verses: VerseChoice[] }>('/v1/verses/themes', { method: 'GET' });
  // Server `/v1/verses/themes` returns themes; for v1 stub we rely on
  // `/v1/status/suggest` which returns one suggested verse. Card 7 wants 12.
  // Until the server endpoint is firmed up, fall back to inline 12-verse stub.
  // TODO: align server contract — either expose /v1/verses/sample?n=12 OR
  // return all 84 from /v1/verses/themes for client-side filter.
  return STUB_PICKER_VERSES;
}

// Inline stub — 12 well-known verses across themes for first-pick UX.
// Real seed pool lives in apps/api/src/verse/verse-pool.ts (84 verses).
const STUB_PICKER_VERSES: VerseChoice[] = [
  { ref: 'Phil 4:6', text: 'Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.', attribution: 'BSB' },
  { ref: 'Prov 3:5-6', text: 'Trust in the LORD with all your heart, and lean not on your own understanding.', attribution: 'BSB' },
  { ref: 'Ps 23:1', text: 'The LORD is my shepherd; I shall not want.', attribution: 'BSB' },
  { ref: 'Jer 29:11', text: 'For I know the plans I have for you, declares the LORD, plans for welfare and not for evil.', attribution: 'BSB' },
  { ref: 'Rom 8:28', text: 'And we know that for those who love God all things work together for good.', attribution: 'BSB' },
  { ref: 'Isa 41:10', text: 'Fear not, for I am with you; be not dismayed, for I am your God.', attribution: 'BSB' },
  { ref: '1 Cor 13:4', text: 'Love is patient, love is kind. It does not envy, it does not boast.', attribution: 'BSB' },
  { ref: 'Ps 46:10', text: 'Be still, and know that I am God.', attribution: 'BSB' },
  { ref: 'John 14:27', text: 'Peace I leave with you; my peace I give to you.', attribution: 'BSB' },
  { ref: 'Matt 11:28', text: 'Come to Me, all you who are weary and burdened, and I will give you rest.', attribution: 'BSB' },
  { ref: 'Eph 2:8', text: 'For by grace you have been saved through faith.', attribution: 'BSB' },
  { ref: 'Ps 27:1', text: 'The LORD is my light and my salvation; whom shall I fear?', attribution: 'BSB' },
];

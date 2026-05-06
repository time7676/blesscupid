// API client. Base URL is read from the EXPO_PUBLIC_API_BASE_URL env var so
// it can be overridden per-build (LAN IP for device dev, prod URL for prod).
declare const process: { env: Record<string, string | undefined> };
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

// Mock activates only when explicitly opted in via EXPO_PUBLIC_USE_API_MOCK=1
// AND we're in __DEV__. In every other case (release build OR dev pointed at
// any non-localhost URL) we hit the real backend. This avoids the failure
// mode where a developer sets EXPO_PUBLIC_API_BASE_URL=<prod url> but still
// silently gets mocked responses, making auth + onboarding feel "broken."
const MOCK_ACTIVE =
  __DEV__ && process.env.EXPO_PUBLIC_USE_API_MOCK === '1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public body: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

// Dev-only mock dispatcher. When __DEV__ is true and there's no backend
// running, every call returns a happy-path response keyed off the URL path.
// Set EXPO_PUBLIC_DISABLE_API_MOCK=1 to bypass the mock and hit a real API.
function devMockResponse(path: string, method: string): unknown {
  if (path.startsWith('/auth/')) {
    return {
      userId: 'dev-test-user',
      accessToken: 'dev-test-access-token',
      refreshToken: 'dev-test-refresh-token',
      expiresIn: 3600,
    };
  }
  if (path === '/onboarding/state') {
    return {
      ageVerifiedAdult: true,
      covenantSigned: false,
      faithComplete: false,
      profileComplete: false,
      hasPhoto: false,
      bioApproved: false,
      onboardingStep: 'covenant',
      nextStep: 'covenant',
    };
  }
  if (path === '/onboarding/questionnaire') {
    return { ok: true };
  }
  if (path === '/onboarding/q3-redirect') {
    return { ok: true, intent: 'friendship' };
  }
  if (path === '/onboarding/welcomed-tags') {
    return { ok: true, welcomedTags: [], welcomedTagVisibility: {} };
  }
  if (path === '/photos/upload-url') {
    return {
      photoId: 'dev-photo-id',
      uploadUrl: 'https://dev.invalid/upload',
      storageKey: 'dev/photo.jpg',
      expiresIn: 600,
      contentType: 'image/jpeg',
    };
  }
  if (/^\/photos\/.*\/finalize$/.test(path)) {
    return {
      photoId: 'dev-photo-id',
      status: 'approved',
      face: {
        faceCount: 1,
        largestFaceAreaRatio: 0.4,
        hasFace: true,
        passes: true,
        reasons: [],
      },
    };
  }
  // Default: ok response. Logging helps spot routes that need a richer mock.
  // eslint-disable-next-line no-console
  console.log(`[api-mock] ${method} ${path} -> { ok: true }`);
  return { ok: true };
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = init;
  // Dev-only short-circuit. Lets the whole onboarding flow be walked end-to-end
  // without a running NestJS API.
  if (MOCK_ACTIVE) {
    const method = (rest.method ?? 'GET').toUpperCase();
    // eslint-disable-next-line no-console
    console.log(`[api-mock] ${method} ${path}`);
    return devMockResponse(path, method) as T;
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
  });
  const text = await res.text();
  const body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  if (!res.ok) {
    const code = (body.code as string | undefined) ?? `http_${res.status}`;
    const msg = (body.message as string | undefined) ?? code;
    throw new ApiError(res.status, code, msg, body);
  }
  return body as T;
}

export interface AuthTokens {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export function signupEmail(input: {
  email: string;
  password: string;
  dob: string;
}): Promise<AuthTokens> {
  return apiFetch<AuthTokens>('/auth/signup/email', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function loginEmail(input: { email: string; password: string }): Promise<AuthTokens> {
  return apiFetch<AuthTokens>('/auth/login/email', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function signupOAuth(input: {
  provider: 'apple' | 'google';
  idToken: string;
  dob: string;
}): Promise<AuthTokens> {
  return apiFetch<AuthTokens>('/auth/signup/oauth', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  return apiFetch<AuthTokens>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

import type {
  BioInput,
  CovenantAcceptInput,
  FaithQuestionnaireInput,
  OnboardingStep,
  ProfileBasicsInput,
  Q3RedirectInput,
  QuestionnaireSubmitInput,
  WelcomedTagsUpdateInput,
} from '@blesscupid/shared';

export interface OnboardingStateResponse {
  ageVerifiedAdult: boolean;
  covenantSigned: boolean;
  faithComplete: boolean;
  profileComplete: boolean;
  hasPhoto: boolean;
  bioApproved: boolean;
  onboardingStep: OnboardingStep;
  nextStep: OnboardingStep;
}

export function getOnboardingState(token: string): Promise<OnboardingStateResponse> {
  return apiFetch<OnboardingStateResponse>('/onboarding/state', {
    method: 'GET',
    token,
  });
}

export function acceptCovenant(
  token: string,
  input: CovenantAcceptInput,
): Promise<{ ok: true }> {
  return apiFetch('/onboarding/covenant', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export function saveFaith(
  token: string,
  input: FaithQuestionnaireInput,
): Promise<{ ok: true }> {
  return apiFetch('/onboarding/faith', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export interface QuestionnaireSubmitResponse {
  ok: boolean;
  q3Redirect?: boolean;
  bioSeedFlagged?: boolean;
  // Soft-suggest revision payload when Q9 bio seed is blocked.
  code?: 'bio_seed_flagged';
  decision?: 'block';
  categories?: string[];
}

export function saveQuestionnaire(
  token: string,
  input: QuestionnaireSubmitInput,
): Promise<QuestionnaireSubmitResponse> {
  return apiFetch<QuestionnaireSubmitResponse>('/onboarding/questionnaire', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export interface Q3RedirectResponse {
  ok: true;
  intent: 'friendship' | 'closed_by_user';
}

export function acceptQ3Redirect(
  token: string,
  input: Q3RedirectInput,
): Promise<Q3RedirectResponse> {
  return apiFetch<Q3RedirectResponse>('/onboarding/q3-redirect', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export function updateWelcomedTags(
  token: string,
  input: WelcomedTagsUpdateInput,
): Promise<{ ok: true; welcomedTags: string[]; welcomedTagVisibility: Record<string, boolean> }> {
  return apiFetch('/onboarding/welcomed-tags', {
    method: 'PATCH',
    token,
    body: JSON.stringify(input),
  });
}

// BLE eng-review 2026-05-06 — onboarding profile basics + bio API.
// `legalName` is captured here for safety routing and is never echoed
// back via /me; only displayName + gender + city + countryCode round-trip
// to other users.
export function saveProfileBasics(
  token: string,
  input: ProfileBasicsInput,
): Promise<{ ok: true }> {
  return apiFetch('/onboarding/profile', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export interface BioResponse {
  ok: true;
  bioApproved: boolean;
  queuedForReview: boolean;
}

export function saveBio(token: string, input: BioInput): Promise<BioResponse> {
  return apiFetch<BioResponse>('/onboarding/bio', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export interface CompleteOnboardingResponse {
  ok: true;
  onboardingCompleted: true;
}

export function completeOnboarding(token: string): Promise<CompleteOnboardingResponse> {
  return apiFetch<CompleteOnboardingResponse>('/onboarding/complete', {
    method: 'POST',
    token,
    body: '{}',
  });
}

export interface MeResponse {
  id: string;
  email: string;
  onboardingCompleted: boolean;
  profile: {
    displayName: string;
    gender: 'male' | 'female';
    city: string;
    countryCode: string;
    onboardingStep: OnboardingStep;
    bio: string | null;
    bioApproved: boolean;
  } | null;
}

export function getMe(token: string): Promise<MeResponse> {
  return apiFetch<MeResponse>('/me', { method: 'GET', token });
}

// BLE eng-review 2026-05-06 — Lane B (matching).
//
// Today screen calls `getMatchesToday` once on mount. The server returns
// a stable list per UTC day so swiping back-and-forth doesn't reshuffle.
// Decisions are recorded one-by-one via `sendMatchDecision`. The favorite
// quota is enforced server-side; the mobile button just needs to be
// visually disabled when `decision === 'favorite'` returns the
// `favorite_quota_exhausted` error code.

export interface MatchTodayCard {
  userId: string;
  displayName: string;
  age: number;
  city: string;
  tradition: string | null;
  walkStage: string | null;
  bio: string | null;
  photoStorageKey: string | null;
}

export interface MatchesTodayResponse {
  stack: MatchTodayCard[];
}

export function getMatchesToday(token: string): Promise<MatchesTodayResponse> {
  return apiFetch<MatchesTodayResponse>('/matches/today', { method: 'GET', token });
}

export type MatchDecision = 'pass' | 'like' | 'favorite';

export interface MatchDecisionResponse {
  ok: true;
  decision: MatchDecision;
  day: string;
}

export function sendMatchDecision(
  token: string,
  candidateUserId: string,
  decision: MatchDecision,
): Promise<MatchDecisionResponse> {
  return apiFetch<MatchDecisionResponse>('/matches/decision', {
    method: 'POST',
    token,
    body: JSON.stringify({ candidateUserId, decision }),
  });
}


export type PhotoContentType = 'image/jpeg' | 'image/png' | 'image/heic';

export interface PhotoUploadUrl {
  photoId: string;
  uploadUrl: string;
  storageKey: string;
  expiresIn: number;
  contentType: PhotoContentType;
}

export interface PhotoFinalizeResult {
  photoId: string;
  status: 'approved' | 'processing' | 'rejected';
  face: {
    faceCount: number;
    largestFaceAreaRatio: number;
    hasFace: boolean;
    passes: boolean;
    reasons: string[];
  };
}

export interface PhotoRejectionPayload {
  code: 'photo_rejected';
  reasons: string[];
  unsafeLabels: string[];
}

export function requestPhotoUpload(
  token: string,
  input: { position: number; contentType: PhotoContentType },
): Promise<PhotoUploadUrl> {
  return apiFetch<PhotoUploadUrl>('/photos/upload-url', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export async function putToS3(
  uploadUrl: string,
  body: Blob,
  contentType: PhotoContentType,
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': contentType },
    body,
  });
  if (!res.ok) {
    throw new ApiError(res.status, 's3_upload_failed', `S3 PUT failed: ${res.status}`);
  }
}

export function finalizePhoto(token: string, photoId: string): Promise<PhotoFinalizeResult> {
  return apiFetch<PhotoFinalizeResult>(`/photos/${photoId}/finalize`, {
    method: 'POST',
    token,
  });
}

export { API_BASE_URL };

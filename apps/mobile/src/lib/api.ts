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
  if (path === '/photos/mine' && method === 'GET') {
    return { items: [] };
  }
  if (/^\/photos\/[^/]+$/.test(path) && method === 'DELETE') {
    return { ok: true };
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
  if (path === '/matches/today') {
    return {
      stack: [
        { userId: 'm1', displayName: 'Mariana', age: 28, city: 'Manila', tradition: 'Catholic', walkStage: 'Daily Mass', bio: "Catechist at St. Anthony's. Walks every morning, reads the saints, makes too much coffee. Looking for someone who'd come to Vespers with me, then dinner.", photoStorageKey: null },
        { userId: 'm2', displayName: 'David', age: 31, city: 'Singapore', tradition: 'Anglican', walkStage: 'Choir tenor', bio: 'Software lead by week, choir by Sunday. Curious about everything, talks about Lewis too much.', photoStorageKey: null },
        { userId: 'm3', displayName: 'Hannah', age: 26, city: 'Cebu', tradition: 'Catholic', walkStage: 'Rosary daily', bio: 'ICU nurse, runs every Sunday morning before Mass. Honest, steady, looking for steady.', photoStorageKey: null },
        { userId: 'm4', displayName: 'Nathan', age: 30, city: 'Jakarta', tradition: 'Reformed', walkStage: 'Seminary', bio: 'MDiv year 2, plays piano at a small church in South Jakarta. Wants someone who reads, prays, and laughs at bad puns.', photoStorageKey: null },
        { userId: 'm5', displayName: 'Sophia', age: 27, city: 'Manila', tradition: 'Catholic', walkStage: 'Carmelite oblate', bio: 'Architect, oblate of the Carmelites, climbs every long weekend. Looking for someone who values silence and good design.', photoStorageKey: null },
        { userId: 'm6', displayName: 'Joel', age: 33, city: 'Cebu', tradition: 'Evangelical', walkStage: 'Long-distance runner', bio: 'Coach and runner. Came back to faith at 28. Looking for someone to grow old slowly with.', photoStorageKey: null },
      ],
    };
  }
  if (path === '/matches/quota') {
    return {
      tier: 'free' as const,
      decisionsLimit: 8,
      decisionsUsed: 0,
      decisionsRemaining: 8,
      favoritesLimit: 1,
      favoritesUsed: 0,
      favoritesRemaining: 1,
    };
  }
  if (path === '/matches/decision') {
    // Pre-alpha: deterministic match flip so testers see MatchSheet ceremony.
    // Mariana (m1) + Hannah (m3) Bless back; everyone else just records.
    // Real backend reads the body's candidateUserId + decision and computes
    // mutual interest server-side.
    return {
      ok: true,
      decision: 'like',
      day: new Date().toISOString().slice(0, 10),
      match: true, // toggle by candidateUserId on real backend
    };
  }
  if (path === '/me') {
    return {
      id: 'dev-test-user',
      email: 'dev@blesscupid.test',
      onboardingCompleted: true,
      profile: {
        displayName: 'Julian',
        gender: 'male' as const,
        city: 'Bali',
        countryCode: 'ID',
        onboardingStep: 'completed' as const,
        bio: 'Walking with one another in faith.',
        bioApproved: true,
      },
    };
  }
  if (path === '/blocks' && method === 'GET') {
    return { items: [] as Array<{ userId: string; displayName: string; blockedAt: string }> };
  }
  if (path === '/auth/email/verify' || path === '/auth/email/resend') {
    return { ok: true };
  }
  if (path === '/auth/password-reset/request' || path === '/auth/password-reset/confirm') {
    return { ok: true };
  }
  if (path === '/me/profile' || path === '/me/preferences' || path === '/me/notifications' || path === '/me/privacy' || path === '/me/pause') {
    return { ok: true };
  }
  if (path === '/reports') {
    return { ok: true, reportId: `r-${Date.now()}` };
  }
  if (path.startsWith('/blocks')) {
    return { ok: true };
  }
  if (path === '/threads' && method === 'GET') {
    return {
      pending: [
        {
          threadId: 'th-m1',
          partnerUserId: 'm1',
          partnerDisplayName: 'Mariana',
          lastMessagePreview: '"Above all, love each other deeply…"',
          lastMessageAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
          unread: true,
          status: 'pending' as const,
        },
      ],
      active: [
        {
          threadId: 'th-m2',
          partnerUserId: 'm2',
          partnerDisplayName: 'David',
          lastMessagePreview: 'Looking forward to coffee Sunday',
          lastMessageAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          unread: false,
          status: 'active' as const,
        },
      ],
    };
  }
  if (/^\/threads\/[^/]+\/messages$/.test(path) && method === 'GET') {
    const id = path.split('/')[2] ?? 'th-m1';
    return {
      threadId: id,
      partnerDisplayName: id === 'th-m2' ? 'David' : 'Mariana',
      anchor: {
        verseText: '"Be anxious for nothing, but in everything by prayer…"',
        verseRef: 'Phil 4:6 · NIV',
      },
      messages: [
        {
          id: 'msg-1',
          from: 'them' as const,
          text: 'Phil 4:6 lands on a long Monday.',
          at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: 'msg-2',
          from: 'me' as const,
          text: 'Quiet first cup, then a list, then prayer between meetings.',
          at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        },
      ],
    };
  }
  if (/^\/threads\/[^/]+\/messages$/.test(path) && method === 'POST') {
    const text = ((init: unknown) => '')(undefined);
    return {
      ok: true,
      message: {
        id: `msg-${Date.now()}`,
        from: 'me' as const,
        text,
        at: new Date().toISOString(),
      },
    };
  }
  if (/^\/matches\/[^/]+\/conversations$/.test(path) && method === 'POST') {
    const matchId = path.split('/')[2];
    return { threadId: `th-${matchId}` };
  }
  if (/^\/matches\/[^/]+$/.test(path) && method === 'GET') {
    const matchId = path.split('/')[2] ?? 'm1';
    const profiles: Record<string, unknown> = {
      m1: {
        userId: 'm1',
        displayName: 'Mariana',
        age: 28,
        city: 'Manila',
        country: 'Philippines',
        tradition: 'Catholic',
        walkStage: 'Daily Mass',
        bio: "Catechist at St. Anthony's. Walks every morning, reads the saints, makes too much coffee.",
        photos: [{ photoId: 'p1', storageKey: 'placeholder' }],
        prompts: [
          {
            question: 'A verse that holds me',
            answer:
              '"Above all, love each other deeply, because love covers over a multitude of sins." — 1 Peter 4:8',
          },
        ],
      },
      m2: {
        userId: 'm2',
        displayName: 'David',
        age: 31,
        city: 'Singapore',
        country: 'Singapore',
        tradition: 'Anglican',
        walkStage: 'Choir tenor',
        bio: 'Software lead by week, choir by Sunday.',
        photos: [{ photoId: 'p2', storageKey: 'placeholder' }],
        prompts: [{ question: 'A book that shaped me', answer: 'C.S. Lewis — Mere Christianity' }],
      },
    };
    return profiles[matchId] ?? { ...(profiles.m1 as object), userId: matchId };
  }
  if (path === '/matches/incoming' && method === 'GET') {
    // Mock: 4 people Blessed me. Free tier blurs all but count.
    const isPaid = false; // toggle to test Bless+ view
    const items = [
      { userId: 'b1', displayName: 'Mariana', age: 28, city: 'Manila', tradition: 'Catholic' as string | null, blessedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
      { userId: 'b2', displayName: 'Hannah', age: 26, city: 'Cebu', tradition: 'Catholic' as string | null, blessedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
      { userId: 'b3', displayName: 'Sophia', age: 27, city: 'Manila', tradition: 'Catholic' as string | null, blessedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() },
      { userId: 'b4', displayName: 'Naomi', age: 29, city: 'Manila', tradition: 'Catholic' as string | null, blessedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
    ];
    return {
      count: items.length,
      tier: (isPaid ? 'plus' : 'free') as 'free' | 'plus' | 'plus_trial',
      items: items.map((it) => ({
        ...it,
        displayName: isPaid ? it.displayName : '—',
        blurred: !isPaid,
      })),
    };
  }
  if (path === '/billing/plans') {
    return {
      plans: [
        { id: 'free', name: 'Free', price: 0, period: 'forever' },
        { id: 'plus', name: 'Bless+', price: 14.99, period: 'month' },
      ],
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

// UU PDP Pasal 11 — right to data portability. Returns a JSON blob the
// user can save to their device. Mobile UI exposes this via Settings →
// Privacy → Export my data. The blob is opaque from the client's POV
// (we don't promise a specific schema beyond best-effort completeness).
export function exportMe(token: string): Promise<unknown> {
  return apiFetch<unknown>('/me/export', { method: 'GET', token });
}

// Push notification token registration. Mobile calls this on cold boot
// after expo-notifications grants permission. Backend dedupes by
// (userId, token); re-registering same token bumps lastSeenAt.
export type PushPlatform = 'ios' | 'android' | 'web';

export function registerPushToken(
  authToken: string,
  input: { token: string; platform: PushPlatform; appVersion?: string },
): Promise<{ ok: true }> {
  return apiFetch('/me/push-token', {
    method: 'POST',
    token: authToken,
    body: JSON.stringify(input),
  });
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
  /**
   * True when the candidate has independently liked/favorited the viewer.
   * Mobile fires the MatchSheet ceremony on this signal.
   */
  match: boolean;
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

export interface MatchQuotaResponse {
  tier: 'free' | 'light' | 'open' | 'deep';
  decisionsLimit: number;
  decisionsUsed: number;
  decisionsRemaining: number;
  favoritesLimit: number;
  favoritesUsed: number;
  favoritesRemaining: number;
  isUnlimited: boolean;
  resetAtIso: string;
}

export function getMatchQuota(token: string): Promise<MatchQuotaResponse> {
  return apiFetch<MatchQuotaResponse>('/matches/quota', { method: 'GET', token });
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

export interface MyPhoto {
  photoId: string;
  storageKey: string;
  position: number;
  status: 'approved' | 'processing' | 'uploaded';
  /** Pre-signed GET URL for direct rendering. May be empty for seed photos. */
  url: string;
  urlExpiresIn: number;
  createdAt: string;
}

export interface MyPhotosResponse {
  items: MyPhoto[];
}

export function getMyPhotos(token: string): Promise<MyPhotosResponse> {
  return apiFetch<MyPhotosResponse>('/photos/mine', { method: 'GET', token });
}

export function deleteMyPhoto(token: string, photoId: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/photos/${photoId}`, { method: 'DELETE', token });
}

// =============================================================
//  Threads / messages — Conversations + Thread screens
// =============================================================

export interface ThreadSummary {
  threadId: string;
  partnerUserId: string;
  partnerDisplayName: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null; // ISO
  unread: boolean;
  status: 'pending' | 'active';
}

export interface ThreadsResponse {
  pending: ThreadSummary[];
  active: ThreadSummary[];
}

export function getThreads(token: string): Promise<ThreadsResponse> {
  return apiFetch<ThreadsResponse>('/chat/threads', { method: 'GET', token });
}

export interface ThreadMessageRow {
  id: string;
  from: 'me' | 'them';
  text: string;
  at: string;
}

export interface ThreadMessagesResponse {
  threadId: string;
  partnerDisplayName: string;
  anchor: { verseText: string; verseRef: string };
  messages: ThreadMessageRow[];
}

export function getThreadMessages(
  token: string,
  threadId: string,
): Promise<ThreadMessagesResponse> {
  return apiFetch<ThreadMessagesResponse>(`/chat/threads/${threadId}/messages`, {
    method: 'GET',
    token,
  });
}

export function sendThreadMessage(
  token: string,
  threadId: string,
  text: string,
): Promise<{ ok: true; message: ThreadMessageRow }> {
  return apiFetch(`/chat/threads/${threadId}/messages`, {
    method: 'POST',
    token,
    body: JSON.stringify({ text }),
  });
}

export function createConversationFromMatch(
  token: string,
  matchUserId: string,
): Promise<{ threadId: string }> {
  return apiFetch<{ threadId: string }>(`/matches/${matchUserId}/conversations`, {
    method: 'POST',
    token,
  });
}

// =============================================================
//  Incoming Blesses — premium-gated "people who Blessed you"
// =============================================================

export interface IncomingBlessRow {
  userId: string;
  displayName: string;
  age: number;
  city: string;
  tradition: string | null;
  blessedAt: string; // ISO
  /** When tier=free, server returns blurred placeholder for displayName/photo. */
  blurred: boolean;
}

export interface IncomingBlessesResponse {
  count: number;
  tier: 'free' | 'plus' | 'plus_trial';
  items: IncomingBlessRow[];
}

export function getIncomingBlesses(token: string): Promise<IncomingBlessesResponse> {
  return apiFetch<IncomingBlessesResponse>('/matches/incoming', { method: 'GET', token });
}

// =============================================================
//  Match detail — ProfileDetail screen
// =============================================================

export interface MatchDetailResponse {
  userId: string;
  displayName: string;
  age: number;
  city: string;
  country?: string | null;
  tradition: string | null;
  walkStage: string | null;
  bio: string | null;
  photos: { photoId: string; storageKey: string }[];
  prompts?: { question: string; answer: string }[];
}

export function getMatchDetail(token: string, matchUserId: string): Promise<MatchDetailResponse> {
  return apiFetch<MatchDetailResponse>(`/matches/${matchUserId}`, { method: 'GET', token });
}

export { API_BASE_URL };

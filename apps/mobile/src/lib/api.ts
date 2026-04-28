// API client. Base URL is read from the EXPO_PUBLIC_API_BASE_URL env var so
// it can be overridden per-build (LAN IP for device dev, prod URL for prod).
declare const process: { env: Record<string, string | undefined> };
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

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

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = init;
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
  CovenantAcceptInput,
  FaithQuestionnaireInput,
  OnboardingStep,
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

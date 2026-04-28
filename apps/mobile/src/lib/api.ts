// API client. Base URL is read from the EXPO_PUBLIC_API_BASE_URL env var so
// it can be overridden per-build (LAN IP for device dev, prod URL for prod).
declare const process: { env: Record<string, string | undefined> };
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
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
    throw new ApiError(res.status, code, msg);
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
} from '@blesscupid/shared';

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

export { API_BASE_URL };

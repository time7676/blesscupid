import Constants from 'expo-constants';

const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
const fromConfig = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)
  ?.apiBaseUrl;
const API_BASE_URL = fromEnv || fromConfig || 'http://localhost:3000';

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
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const code = (body as { code?: string }).code ?? `http_${res.status}`;
    throw new ApiError(res.status, code, (body as { message?: string }).message ?? code);
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

export { API_BASE_URL };

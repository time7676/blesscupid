/**
 * Thin typed wrapper over fetch for the onboarding API surface defined in
 * BLE-23 engineering-spec. Server implementations land in a separate issue
 * (non-goal here). This file is the client contract.
 */

import type { OnboardingContext } from '../state/onboardingMachine';

const BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'https://api.blesscupid.app';

let sessionToken: string | null = null;
export const setSessionToken = (t: string | null) => {
  sessionToken = t;
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(sessionToken ? { authorization: `Bearer ${sessionToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(res.status, body);
  }
  return (await res.json()) as T;
}

export class ApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`API ${status}: ${body}`);
  }
  isRateLimited() {
    return this.status === 429;
  }
  isBudgetCap() {
    return this.status === 503 && this.body.includes('budget_cap_exceeded');
  }
}

export type OtpRequestArgs = { method: 'phone' | 'email'; identifier: string };
export type OtpRequestResult = { otpToken: string; expiresAt: string };

export const requestOtp = (args: OtpRequestArgs) =>
  call<OtpRequestResult>('/api/v1/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify(args),
  });

export type OtpVerifyArgs = { otpToken: string; code: string };
export type OtpVerifyResult = { sessionToken: string; isNewUser: boolean };

export const verifyOtp = (args: OtpVerifyArgs) =>
  call<OtpVerifyResult>('/api/v1/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify(args),
  });

export type DraftPatchArgs = { state: string; context: OnboardingContext };
export type DraftPatchResult = { draftId: string; updatedAt: string };

export const patchDraft = (args: DraftPatchArgs) =>
  call<DraftPatchResult>('/api/v1/onboarding/draft', {
    method: 'PATCH',
    body: JSON.stringify(args),
  });

export type UploadUrlArgs = {
  kind: 'photo' | 'selfie';
  contentType: 'image/jpeg' | 'image/png' | 'image/heic';
};
export type UploadUrlResult = { uploadUrl: string; assetId: string };

export const requestUploadUrl = (args: UploadUrlArgs) =>
  call<UploadUrlResult>('/api/v1/onboarding/upload-url', {
    method: 'POST',
    body: JSON.stringify(args),
  });

export type LivenessStartResult = {
  sessionId: string;
  sdkParams: Record<string, unknown>;
};

export const startLiveness = () =>
  call<LivenessStartResult>('/api/v1/onboarding/liveness/start', {
    method: 'POST',
    body: JSON.stringify({ vendor: 'aws-rekognition' }),
  });

export type LivenessFinalizeResult = {
  verdict: 'pass' | 'fail';
  verificationId: string;
};

export const finalizeLiveness = (sessionId: string) =>
  call<LivenessFinalizeResult>('/api/v1/onboarding/liveness/finalize', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });

export type CompleteResult = { userId: string; profile: Record<string, unknown> };

export const completeOnboarding = (context: OnboardingContext) =>
  call<CompleteResult>('/api/v1/onboarding/complete', {
    method: 'POST',
    body: JSON.stringify({ context }),
  });

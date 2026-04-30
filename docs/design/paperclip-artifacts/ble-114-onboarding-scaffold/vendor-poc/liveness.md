# Liveness vendor PoC — AWS Amplify Liveness (RN)

**Decision:** AWS Amplify Liveness React Native (`@aws-amplify/ui-react-native` + Amazon Rekognition Liveness backend).

## Why

- $0.001 per liveness check. $200/mo cap = 200k checks. MVP volume <5k/mo, leaves 40× headroom.
- First-party React Native component (`<FaceLivenessDetector>`).
- Expo prebuild compatible (requires native modules; works once BLE-13 prebuild lands).
- Server-side ML (no on-device model) = small bundle.
- Indonesia region: `ap-southeast-1` (Singapore), <50ms p50 from Jakarta.

## PoC steps

1. `expo prebuild` if not already (BLE-13 dependency).
2. Add native deps:
   ```
   pnpm add aws-amplify @aws-amplify/ui-react-native @aws-amplify/ui-react-native-liveness
   pnpm add @aws-amplify/rtn-web-browser @react-native-async-storage/async-storage
   pnpm add react-native-get-random-values react-native-url-polyfill
   ```
3. iOS: `cd ios && pod install`. Android: gradle picks up automatically.
4. `Amplify.configure({ Auth: { Cognito: { identityPoolId, region: 'ap-southeast-1' } } })` — bootstrap in `app/_layout.tsx`.
5. Backend: provision Cognito Identity Pool with unauthenticated role allowed to call `rekognition:CreateFaceLivenessSession`.
6. PoC verdict criteria: real-device selfie passes sandbox check on iOS 16 + Android 13.

## Wrapper contract (`<CameraLivenessFrame>`)

```ts
type CameraLivenessFrameProps = {
  onComplete: (verificationId: string) => void;
  onError: (err: LivenessError) => void;
  prompts?: string[];  // ignored by AWS — vendor controls prompts
};
```

Internal: calls `POST /api/v1/onboarding/liveness/start` to get a `sessionId` from server (server calls `CreateFaceLivenessSession`), passes it to `<FaceLivenessDetector sessionId={...}>`. On `onAnalysisComplete`, calls `POST /api/v1/onboarding/liveness/finalize { sessionId }` server-side which calls `GetFaceLivenessSessionResults` and returns `{ verdict, verificationId }`.

## Fallback — Veriff

If AWS Amplify RN binding regresses (last 12 months has had 2 major breaking changes), swap to Veriff.

```ts
// CameraLivenessFrame.tsx
- import { FaceLivenessDetector } from '@aws-amplify/ui-react-native-liveness';
+ import VeriffSdk from '@veriff/react-native-sdk';
```

Veriff bills per session ($1.49). At MVP scale that's $7.50/mo for 5k checks — still within cap, more expensive per-check but more stable.

## Cost guardrail

Server middleware tracks liveness session count per day. If daily count > 6,500 (~ $200/mo run-rate), `POST /onboarding/liveness/start` returns `503 budget_cap_exceeded`. Client renders an `state/critical` toast: *"Verifikasi sedang penuh. Coba lagi nanti."* Screen 06 stays on retry state. CEO + FoundingEngineer alerted via Sentry breadcrumb.

## Open questions

- AWS Liveness UI is English-only by default — confirm it accepts Bahasa locale strings or if we ship with English vendor strings inside an Indonesian wrapper. (Probable: vendor strings stay English; our title + helper around the camera frame are Bahasa.)
- Can we self-throttle vendor SDK init to avoid spinning up Cognito for users who back out? Lazy-init on screen 06 mount only.

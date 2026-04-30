# BLE-114 — Onboarding Scaffold

Scaffold artifacts for [BLE-114](/BLE/issues/BLE-114), implementing the onboarding flow per [BLE-23 plan rev 2](/BLE/issues/BLE-23#document-plan), [engineering-spec](/BLE/issues/BLE-23#document-engineering-spec), [wireframes](/BLE/issues/BLE-23#document-wireframes), and [edge-states](/BLE/issues/BLE-23#document-edge-states).

These files are designed to be dropped into the Expo Router app once [BLE-13](/BLE/issues/BLE-13) lands. Until then they live here as the canonical reference scaffold.

## Layout

```
app/onboarding/
  _layout.tsx                 -- stack + ProgressDots header + onboardingMachine wiring
  index.tsx                   -- 01 Welcome
  auth/
    entry.tsx                 -- 02a Auth entry (phone | email tab toggle)
    otp.tsx                   -- 02b OTP verify
  modes.tsx                   -- 03 Mode pick (Pacaran / Persahabatan / Komunitas)
  faith-statement.tsx         -- 04 Covenant + checkbox
  photo.tsx                   -- 05 Photo upload
  selfie.tsx                  -- 06 Liveness selfie
  faith-profile.tsx           -- 07 Faith profile (denomination, verse, journey, serving)
  marriage-timeline.tsx       -- 07a Marriage timeline (rendered only if 'pacaran' ∈ selectedModes)
  done.tsx                    -- 08 Welcome / verse hero

components/onboarding/
  ProgressDots.tsx
  TabToggle.tsx
  PhoneInput.tsx
  OTPInput.tsx
  ModeCard.tsx
  RadioCard.tsx
  Checkbox.tsx
  Dropdown.tsx
  VerseCard.tsx
  CameraLivenessFrame.tsx
  PhotoUploadDropzone.tsx
  Toast.tsx                   -- shared, amber-700 critical (never red)

state/
  onboardingMachine.ts        -- XState v5 machine
  persistence.ts              -- AsyncStorage + draft sync
  selectors.ts                -- shouldRenderMarriageTimeline, currentStepIndex, etc.

lib/
  api.ts                      -- typed fetch wrapper for /api/v1/onboarding/*
  analytics.ts                -- track() helper, redaction lint targets
  validation.ts               -- Postel phone normalize, email regex, OTP, char limits
  i18n.ts                     -- string IDs (no inline literals — Pastor-locked copy)

vendor-poc/
  liveness.md                 -- AWS Rekognition Liveness PoC plan + fallback
  otp-autofill.md             -- iOS one-time-code + Android SMS Retriever PoC
  heic.md                     -- HEIC decode pipeline pick
```

## Vendor decisions (final SDK calls)

| Concern | Choice | Reason | Fallback |
|---|---|---|---|
| Liveness | **AWS Amplify Liveness React Native** (`@aws-amplify/ui-react-native` + Rekognition Liveness) | First-party RN component, $0.001/check fits $200/mo cap (≈ 200k checks), Expo Module compatible via prebuild. | **Veriff** — drop-in replacement, swap `<CameraLivenessFrame>` impl. Document swap in `vendor-poc/liveness.md`. |
| OTP autofill (iOS) | `textContentType="oneTimeCode"` on each `<TextInput>` of `<OTPInput>` | Native iOS auto-fill from Messages, no SDK | n/a |
| OTP autofill (Android) | **`react-native-otp-verify`** (SMS Retriever API) | Maintained, no `READ_SMS` permission, Expo Module compatible. | Manual paste-supported fallback in `<OTPInput>`. |
| HEIC photos | **Server-side normalize on upload** (`sharp` on the API gateway). Client uploads as-is. | Client stays vendor-agnostic. Avoids native module on Android. Aligns with eng-spec recommendation. | If server can't be ready by v1.0: `react-native-heic-converter` on Android-only path. |
| State machine | **XState v5** (`@xstate/react`, `useActor`) | Eng-spec already shapes context as XState. Visualizer aids handoff. Resume support via persisted snapshot. | If overhead too heavy: collapse to Zustand store with explicit `transition()` reducer. Same context shape. |
| Persistence | `AsyncStorage` (Expo) + server PATCH `/onboarding/draft` debounced 500ms | TTL 30d server-side per spec. AsyncStorage mirror = offline kill/resume. | n/a |
| Telemetry | **PostHog React Native** | Self-hosted option later, OSS, props-redaction lint friendly. | Segment (paid) if PostHog mobile SDK proves fragile. |
| SMS provider | **Twilio Verify** for ID + global | Verify endpoint encapsulates rate limit + retry + locale templates. | Vonage. Final-final pick is CEO + finance. Engineering only swaps the API layer. |

CEO budget cap = $200/mo MVP for liveness. AWS Liveness fits comfortably. Veriff documented as swap-in if AWS RN binding regresses.

## Engineering risks (highest first)

1. **Expo prebuild required** for AWS Amplify Liveness and `react-native-otp-verify` (both native modules). Confirm BLE-13 ships with prebuild (not Expo Go). If BLE-13 stays in Expo Go, escalate to FoundingEngineer + CEO.
2. **HEIC upload path** depends on backend pipeline ([separate issue, non-goal here]). Stub returns success; client uploads raw HEIC bytes. Document API contract.
3. **Liveness camera permission** flow needs `expo-camera` + `Camera.requestCameraPermissionsAsync()` on entering screen 06. Permission-denied edge state per [edge-states doc](/BLE/issues/BLE-23#document-edge-states).
4. **Reduced motion** — verified via `useReducedMotion()` from `react-native-reanimated`. All hero fade-ins are gated behind this hook.
5. **Storybook RN** is heavy — eng-spec calls for Storybook stories on each NEW component. Defer to a follow-up if BLE-13 doesn't ship Storybook.

## Acceptance-criteria mapping

| AC | Where covered |
|---|---|
| All 8 screens render at 390×844 + 360 | `app/onboarding/*.tsx` use `flex` + `SafeAreaView`, no hard pixel widths |
| Reduced-motion variant | All screens consume `useReducedMotion()` and disable fade-ins |
| WCAG AA | tokens locked to `text-primary` on `bg-canvas` (cobalt-900 on cream-50 = 14.4:1) |
| Liveness vendor integrated | `<CameraLivenessFrame>` wraps `@aws-amplify/ui-react-native` `<FaceLivenessDetector>` |
| OTP autofill | `<OTPInput>` sets `textContentType="oneTimeCode"` + Android SMS retriever hook |
| Resume after kill | `state/persistence.ts` rehydrates machine from AsyncStorage on `onboardingMachine` start |
| Anti-dark-pattern | `<Checkbox checked={false}>` default, no urgency timers, skip is a `<Link>` (tertiary) |

## Definition of "scaffold-ready"

Code in this directory is **not** intended to compile in isolation. It assumes the [BLE-22 design tokens](/BLE/issues/BLE-22#document-tokens) are exported from `@blesscupid/design-system`, the [BLE-13](/BLE/issues/BLE-13) Expo scaffold is bootstrapped, and `expo-router` + `xstate` + `@xstate/react` are installed.

When BLE-13 lands, FoundingEngineer drops these files into the repo and runs `pnpm typecheck`. Any tokens or primitive components missing become follow-up issues against BLE-22.

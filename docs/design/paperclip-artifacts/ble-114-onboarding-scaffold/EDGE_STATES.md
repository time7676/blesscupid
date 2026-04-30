# Edge-state coverage map

Source: [BLE-23 edge-states](/BLE/issues/BLE-23#document-edge-states). This file maps each edge state to where it's handled in the scaffold so the next reviewer can see the wiring at a glance.

| Screen | State | Trigger | Where it lives |
|---|---|---|---|
| 01 Welcome | Loading (fonts) | Cold start | `app/onboarding/index.tsx` (font block via Expo `useFonts` in real impl; CTA disabled while loading is host-app concern) |
| 01 Welcome | Offline | No net | CTA stays enabled; failure surfaces on screen 02 |
| 02 Auth entry | Invalid phone | KIRIM tap | `auth/entry.tsx` `submit()` validates via `normalizePhoneId`, sets `error` |
| 02 Auth entry | Invalid email | Email tab | `submit()` validates via `isEmail` |
| 02 Auth entry | Rate-limited | 4th OTP/min | `submit()` catches `ApiError.isRateLimited()`, shows warning Toast |
| 02 Auth entry | Network failure | API timeout | `submit()` catch sets toast |
| 02b OTP | Wrong code | verify fail | `auth/otp.tsx` `verify()` sets `error`, clears `code` |
| 02b OTP | Resend cooldown | Resend pre-60s | `cooldown` state, button disabled, shows countdown via `t('otp.resend.cooldown')` |
| 03 Modes | Zero selection | LANJUT tap | Button stays disabled (`opacity 0.4`); guard in machine rejects |
| 03 Modes | Three selected | 4th tap | `toggle()` only adds when length < 3 |
| 04 Covenant | Unread | LANJUT tap | Checkbox unchecked → button disabled |
| 04 Covenant | Reduced motion | OS pref | Body renders without fade; `accessibilityLiveRegion="polite"` for SR |
| 05 Photo | Permission denied | Picker | `PhotoUploadDropzone.pick()` handles, surfaces `Toast` `critical` |
| 05 Photo | Too large | File > 10MB | `pick()` returns early with `too_large` |
| 05 Photo | Unsupported format | Non-JPG/PNG/HEIC | `unsupported_format` |
| 05 Photo | Network during upload | PUT fail | `network` toast |
| 06 Selfie | Camera permission denied | OS denial | `CameraLivenessFrame` checks `Camera.requestCameraPermissionsAsync()`, renders settings link |
| 06 Selfie | Low light | Vendor verdict | `onError` `low_light` toast |
| 06 Selfie | No face found | Vendor | `onError` `face_not_found` |
| 06 Selfie | Budget cap | API 503 | `ApiError.isBudgetCap()` → `budget_cap_exceeded` toast |
| 06 Selfie | Vendor failure | Generic | `vendor_failure` retryable toast |
| 07 Faith profile | Verse over 180 | Type | `maxLength={180}` + counter goes red via `charsRemaining` |
| 07 Faith profile | Journey over 500 | Type | `maxLength={500}` |
| 07 Faith profile | Serving > 5 | 6th tap | Chip disabled; `accessibilityState.disabled` |
| 07 Faith profile | "Lainnya" denom without text | LANJUT | `isFaithProfileSubmittable` returns false |
| 07a Marriage timeline | Pacaran not selected (deep link) | Bad route | `useEffect` redirects to `/onboarding/done` |
| 08 Done | Server complete fails | API down | `useEffect` swallows; user reaches home anyway, draft eventually flushed |
| All | App killed mid-flow | Relaunch | `state/persistence.ts` rehydrates from AsyncStorage; `_layout.tsx` redirects to last step |
| All | Reduced motion | OS pref | `useReducedMotion()` gates all entrance animations |

## Anti-dark-pattern receipts

- `<Checkbox>` rejects `defaultChecked` → enforced at type level (no prop). `faith-statement.tsx` initializes `checked={false}`.
- No urgency timers anywhere. OTP resend cooldown is *constructive* (rate limit protection), not pressure copy.
- Skip on screen 08 is a `<Link>`, visually `text-tertiary`, never hidden.
- All inline errors render in `state/critical` (amber-700, never red). See `Toast.tsx`.

## Open

- "Profanity in `favoriteVerse`" edge state → moderation API not yet stubbed in scaffold. Track as separate child issue (covered upstream by [BLE-54](/BLE/issues/BLE-54) moderation pipeline).

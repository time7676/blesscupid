# BlessCupid — Comprehensive Screen Map (pre-alpha)

> Locked 2026-05-06. Source-of-truth for what screens, modals, and sheets MUST exist for the app to function. Status legend: ✅ built · 🟡 partial / mocked · 🔴 missing · ⏳ deferred to v1.1.

## How to read this

Every row is reachable from somewhere. If a screen has no entry-point, it's dead code. Cross-references in the **From** column show how the user lands on this surface. **API** column lists the endpoints the screen depends on.

---

## A · Auth flow (pre-onboarding)

| # | Screen / Modal | Status | From | API | Notes |
|---|---|---|---|---|---|
| A1 | Welcome (splash + brand mark + 2 CTAs) | ✅ | App launch w/o userId | — | `auth/Welcome.tsx` |
| A2 | Signup (email + password + Apple/Google) | ✅ | Welcome → "Create account" | `/auth/signup/email`, `/auth/signup/oauth` | `auth/Signup.tsx` |
| A3 | Login | ✅ | Welcome → "I have an account" | `/auth/login/email` | `auth/Login.tsx` |
| A4 | **Forgot password** | 🔴 | Login → "Forgot?" link | `/auth/password-reset/request`, `/auth/password-reset/confirm` | NEW |
| A5 | **Email verification** (6-digit OTP screen) | 🔴 | Signup success → check inbox flow | `/auth/email/verify`, `/auth/email/resend` | NEW — block onboarding until verified |
| A6 | **Phone verification** ⏳ | ⏳ | Optional v1.1 — SMS OTP | — | Defer |
| A7 | Apple/Google OAuth handoff modal | 🟡 | Inline in Signup | — | Native sheet via expo-apple-authentication |

## B · Onboarding flow (post-auth, pre-app)

| # | Screen / Modal | Status | From | API | Notes |
|---|---|---|---|---|---|
| B1 | AgeGate (18+) | ✅ | First entry post-signup | `/onboarding/state` | `onboarding/AgeGate.tsx` |
| B2 | Covenant (Holy Code acceptance) | ✅ | After age confirm | `/onboarding/covenant` | `onboarding/Covenant.tsx` |
| B3 | Faith questionnaire (tradition + practice) | ✅ | After covenant | `/onboarding/faith`, `/onboarding/questionnaire` | `onboarding/Faith.tsx` |
| B4 | DatingOutOfScope (Q3 same-sex redirect) | ✅ | Conditional from Faith | `/onboarding/q3-redirect` | `onboarding/DatingOutOfScope.tsx` |
| B5 | ProfileBasics (name, gender, city) | ✅ | After Faith | `/onboarding/profile` | `onboarding/ProfileBasics.tsx` |
| B6 | FirstPhoto (camera + face detection) | ✅ | After ProfileBasics | `/photos/upload-url`, `/photos/{id}/finalize` | `onboarding/FirstPhoto.tsx` |
| B7 | Bio (text + moderation) | ✅ | After FirstPhoto | `/onboarding/bio` | `onboarding/Bio.tsx` |
| B8 | **Onboarding success / first-day welcome** | 🔴 | After Bio submit | `/onboarding/complete` | NEW — celebratory landing before AppShell |
| B9 | Catechism beats 1–8 (educational sequence) | ✅ | Optional path mid-onboarding | — | `catechism/Beat1Tagline.tsx` etc. |

## C · Main app (AppShell — bottom-tab nav)

| # | Screen / Modal | Status | From | API | Notes |
|---|---|---|---|---|---|
| C1 | **Today** (swipe deck) | ✅ | Tab "Today" (default) | `/matches/today`, `/matches/decision`, `/matches/quota` | `app/Today.tsx` w/ SwipeDeck |
| C2 | **ProfileDetailSheet** (full sheet) | ✅ | Today: tap card OR long-press | `/matches/{id}` (mocked, 🟡) | `lib/design-system/components/ProfileDetailSheet.tsx` |
| C3 | **Match modal (mutual interest)** | 🔴 | Today: after Bless commit if mutual | `/matches/decision` returns `{ match: true }` (server-side) | NEW — Sheet variant=match, 560ms ceremony, gold rule + serif name + verse |
| C4 | Conversations (thread list) | ✅ | Tab "Conversations" | `/threads` (assumed) | `app/Conversations.tsx` |
| C5 | Thread (chat) | ✅ | Conversations → row tap | `/threads/{id}/messages`, `POST /threads/{id}/messages` | `app/Thread.tsx` |
| C6 | **Verse anchor sheet (chat opener)** | 🟡 | Thread: first message of new conversation | — | Pre-Bless verse send required by Holy Code. Embedded in Thread. |
| C7 | **Report user from chat** | 🔴 | Thread: header overflow → "Report" | `POST /reports` | NEW — required for safety floor (Holy Code) |
| C8 | **Block user confirm** | 🔴 | Thread or ProfileDetail: "Block" button | `POST /blocks` | NEW — Sheet variant=confirm |
| C9 | **Block reason picker** ⏳ | ⏳ | Inside Block sheet | — | Defer; v1.1 collects reason. v1 just blocks. |
| C10 | **Pastor escalation modal** | 🟡 | Server-pushed when moderation flag fires | — | Sheet variant=pastor exists; needs trigger wiring. Display-only in v1. |
| C11 | You (account home) | 🟡 | Tab "You" | `/me` | `app/You.tsx` — listed callbacks not all wired |
| C12 | **Edit profile** | 🔴 | You → "Edit profile" row | `PATCH /me/profile` | NEW |
| C13 | **Edit photos** (add/remove/reorder) | 🔴 | You → photo grid → tap | `/photos/upload-url`, `/photos/{id}` | NEW |
| C14 | **Filter / preferences** (age range, distance, tradition) | 🔴 | You → "Match preferences" | `GET/PATCH /me/preferences` | NEW |
| C15 | **Notifications settings** | 🔴 | You → "Notifications" | `PATCH /me/notifications` | NEW |
| C16 | **Privacy settings** | 🔴 | You → "Privacy" | `PATCH /me/privacy` | NEW |
| C17 | **Blocked users list** | 🔴 | You → "Blocked" | `GET /blocks`, `DELETE /blocks/{id}` | NEW |
| C18 | **Pause profile / vacation mode** | 🔴 | You → "Pause" | `POST /me/pause` | NEW |
| C19 | **Account & data** (export, delete) | 🟡 | You → "Account" | `GET /me/export`, `DELETE /me` | NEW screen (export + delete buttons exist via API) |
| C20 | **Sign out** | 🟡 | You → "Sign out" | client-side clear secure-store | Existing button, confirm modal needed |
| C21 | **Help / Support / FAQ** | 🔴 | You → "Help" | static or `GET /help` | NEW |
| C22 | **About / Terms / Privacy policy** | 🔴 | You → "Legal" | static URLs (in-app webview) | NEW |
| C23 | **Verse-of-day full screen** ⏳ | ⏳ | Today: tap verse card | static or `/verses/today` | Defer; inline VerseCard sufficient for v1 |
| C24 | **Verse archive** ⏳ | ⏳ | Verse-of-day → "Past verses" | `GET /verses/archive` | Defer |

## D · Subscription / monetization

| # | Screen / Modal | Status | From | API | Notes |
|---|---|---|---|---|---|
| D1 | **GatedFeatureSheet** (paywall pop) | ✅ | Server returns `quota_decisions_exhausted` etc. | — | `app/modals/GatedFeatureSheet.tsx` exists |
| D2 | **OneTimeOfferSheet** (limited promo) | ✅ | Quota exhaust → upsell | — | `app/modals/OneTimeOfferSheet.tsx` exists |
| D3 | **Upgrade / pricing screen** | 🔴 | You → "Upgrade", GatedFeatureSheet → "See plans" | `GET /billing/plans` | NEW — full-screen tier comparison |
| D4 | **Plan tier detail / benefits** | 🔴 | Upgrade → tap a tier | — | NEW — within Upgrade screen, modal expand |
| D5 | **Payment flow** ⏳ | ⏳ | Upgrade → "Subscribe" | `POST /billing/subscribe` (Stripe / Apple IAP / Google Billing) | Defer to v1.1; native IAP integration is multi-week |
| D6 | **Payment success** | 🔴 | Post-subscribe | — | NEW |
| D7 | **Manage subscription** | 🔴 | You → "Manage" (Bless+ tier) | `GET /billing/subscription`, `POST /billing/cancel` | NEW |
| D8 | **Quota status indicator** | 🟡 | Today header (low quota only) | `/matches/quota` | DONE this session — chip in header trailing |

## E · Safety & moderation (Holy Code §HCoC)

| # | Screen / Modal | Status | From | API | Notes |
|---|---|---|---|---|---|
| E1 | Pastor escalation pop (non-dismissible) | 🟡 | Server flag → push | — | Sheet variant=pastor wired; server trigger missing |
| E2 | **Safety center** (resources, hotlines) | 🔴 | You → "Safety" or report flow | static | NEW — required pre-launch (App Store policy) |
| E3 | **Photo moderation pending state** | 🟡 | FirstPhoto: face detection retry | `/photos/{id}/finalize` | Inline UX exists; no separate screen needed |
| E4 | **Bio moderation rejected state** | 🟡 | Bio: server returns rejection | `/onboarding/bio` | Inline error pill in Bio screen |
| E5 | **Account flagged / under review** banner | 🔴 | Server returns `account_flagged` | — | Top banner / modal — new |

## F · Background / system

| # | Screen / Modal | Status | From | API | Notes |
|---|---|---|---|---|---|
| F1 | Splash / hydrating loader | ✅ | App launch, before nav decision | — | Inline in App.tsx |
| F2 | Offline banner | ✅ | Network change detected | — | `OfflineBanner` component exists |
| F3 | Toast (transient feedback) | ✅ | Anywhere | — | `ToastProvider` + `useToast` |
| F4 | **Force-update screen** ⏳ | ⏳ | `/me` returns minVersion mismatch | — | Defer to v1.1 |
| F5 | **Maintenance mode screen** ⏳ | ⏳ | API returns 503 maintenance | — | Defer to v1.1 |

---

## Pre-alpha P0 build queue (must ship for tester demo)

In dependency order:

1. **C3 Match modal** — fires when both Bless. 560ms ceremony per design system.
2. **C7 Report user** — chat overflow → report screen w/ category picker.
3. **C8 Block confirm** — already designed (Sheet variant=confirm), wire to Thread + ProfileDetail.
4. **C19+C20 Account & sign-out confirm** — small but necessary for testers.
5. **C12 Edit profile (name + bio)** — minimal version, no photo edit yet.
6. **C13 Edit photos** — add + remove (no reorder yet).
7. **A4 Forgot password** — minimal email flow.
8. **A5 Email verification** — 6-digit OTP screen.
9. **C11 You polish** — wire all listed callbacks, hide unbuilt rows.
10. **B8 Onboarding success** — single screen, cathedral-light celebratory.
11. **D3 Upgrade screen** — pricing tier comparison (no payment, just UI).
12. **C14 Filter / preferences** — minimal: tradition multi-select + age range.

## Pre-alpha P1 (nice-to-have, can defer)

13. **C15 Notifications settings**
14. **C16 Privacy settings**
15. **C17 Blocked list**
16. **C18 Pause profile**
17. **C21 Help / Support**
18. **C22 About / Legal**
19. **E2 Safety center**

## Deferred (v1.1+)

- A6 Phone verification
- C9 Block reason picker
- C23, C24 Verse-of-day archive
- D5–D7 Payment flow + subscription mgmt
- F4, F5 Force-update / maintenance

---

## Reachability check (every screen must have an entry)

After build, run `rg "navigation.navigate\|onPress=.*Press\|component={"` to verify every screen above is referenced from at least one entry-point. Dead screens = bug.

## API endpoints implied

Already in NestJS: auth/*, onboarding/*, matches/*, me/*, photos/*.

**Missing endpoints needed for full P0 ship:**
- `POST /reports`
- `POST /blocks`, `GET /blocks`, `DELETE /blocks/{id}`
- `PATCH /me/profile` (display name, bio, gender, city)
- `GET/PATCH /me/preferences`
- `PATCH /me/notifications`, `PATCH /me/privacy`
- `POST /me/pause`
- `DELETE /me` (hard-delete)
- `POST /auth/password-reset/request`, `/auth/password-reset/confirm`
- `POST /auth/email/verify`, `/auth/email/resend`
- `GET /matches/{id}` (full profile detail)
- `GET /billing/plans`, `POST /billing/subscribe` (D5 deferred)

For pre-alpha mock-mode: all of the above can return `{ ok: true }` from `devMockResponse` and ship.

---

## Build order — this session

P0 #1–#9 in order. Each screen wired into navigation, mock-API mock added, typecheck pass before proceeding to next. Aim: by end of session, all P0 reachable in Expo Go.

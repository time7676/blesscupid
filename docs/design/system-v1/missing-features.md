# BlessCupid — Missing Core Features (user POV)

> Locked 2026-05-06. Walks through the app as a real user would, surfacing every "I want to do X" that has no answer or only partial answer today. Ranked by impact + complexity. Source for the next sprint plan.

Status legend: ✅ built · 🟡 partial / mocked · 🔴 missing · 🚫 banned by Holy Code §HCoC

---

## I · My profile (the user's own surface)

User intent: *"I want to see what others see, fix what looks bad, and keep it fresh."*

| # | Feature | Status | Priority | Notes |
|---|---|---|---|---|
| I1 | **Preview my profile (as another user sees it)** | 🔴 | **P0** | Tinder/Hinge "Preview" toggle. Renders ProfileDetailScreen w/ my own data. One tap on "Eye" icon top-right of EditProfile. |
| I2 | **Photo manager — 8 photos** | 🟡 | **P0** | Currently placeholder grid. Build: add (camera/library), remove, drag-reorder, set primary, mark highlight. 8 max enforced client + server. |
| I3 | **Highlight photos** | 🔴 | **P0** | Pin 1–2 photos as "highlights" (gold-rule overlay). Shows first to viewers. |
| I4 | **Edit prompts / answers** (Hinge-style Q&A) | 🔴 | **P0** | 3 prompts pickable from pastor-curated list. e.g. "A verse that holds me", "My slow Sunday". Same pool used in onboarding bio screen. |
| I5 | **Verify my photo (blue check)** | 🔴 | P1 | Live selfie liveness compared to primary photo. Uses existing Rekognition. Visible badge on profile. Required for Bless+ verification in some markets. |
| I6 | **Edit faith details** (re-take questionnaire) | 🟡 | **P0** | Settings → Match preferences currently does tradition + age. Add: walk stage · marriage timeline · church attendance · spiritual gifts · welcomed-tags. All exist in Prisma. |
| I7 | **Set "looking for" intent** | 🟡 | P1 | Schema has Q2 Intent (dating/friendship/community/unspecified). Surfaced once at onboarding. User can't change. |
| I8 | **Add Instagram / Spotify / book embed** | 🔴 | P2 | Defer — adds privacy concerns + scope. v1.1+. |
| I9 | **Upload short video** | 🔴 | 🚫 | Banned. Holy Code anti-pattern (sexualized motion). Photos only. |
| I10 | **Delete a single photo without re-uploading the rest** | 🔴 | P0 | Currently placeholder. Prereq for I2. |
| I11 | **My deal-breakers** | 🔴 | P1 | Bless+ feature: "I won't see anyone who [smokes / drinks / has kids / lives >X km]." Server filter. |

---

## II · Onboarding — prerequisite questions for matching algorithm

User intent: *"The more honest signal I give, the better my matches."*

Schema already has these enums (BLE-124). Most are NOT collected in onboarding today.

| # | Question | Schema enum | Asked today? | Priority |
|---|---|---|---|---|
| II1 | Tradition (Catholic / Anglican / etc.) | `Tradition` | ✅ | — |
| II2 | Walk stage (lifelong / returning / etc.) | `WalkStage` | ✅ | — |
| II3 | **Marriage timeline** (within 1y / 2y / 5y / open) | `MarriageIntent` | 🔴 | **P0** |
| II4 | **Marriage open?** (yes / maybe / no) | `MarriageOpen` | 🔴 | **P0** — `no` triggers friendship redirect |
| II5 | **Church attendance** (weekly / monthly / occasional / rarely) | `ChurchAttendance` | 🔴 | **P0** — high signal |
| II6 | **Practice tags** (Sunday in-person / Catholic mass / daily prayer / small group / worship at home / still finding) | `PracticeTag[]` | 🔴 | P0 |
| II7 | **Spiritual gifts** (teaching / mercy / hospitality / etc.) | `SpiritualGift[]` | 🔴 | P1 |
| II8 | **Welcomed tags** self-ID (family-of-origin patterns, sensitivities) | `WelcomedTag[]` | 🟡 onboarding has visibility map but no surface | P0 |
| II9 | **What I'm seeking** (woman / man / unspecified) | `Seeking` | 🟡 collected in Q3 redirect path | — |
| II10 | **Lifestyle: smoking / drinking / exercise / kids** | not in schema | 🔴 | P1 — common in Hinge / Bumble; needs schema extension |
| II11 | **Deal-breaker prerequisites** (mirror of II10) | not in schema | 🔴 | P1 |
| II12 | **My ideal Sunday** (free-text prompt) | could reuse `Profile.bio` | 🟡 | — |
| II13 | **Why now?** (returning / new in town / friend-recommended / curious) | not in schema | 🔴 | P2 — for product analytics |
| II14 | **Voice/style sample for chat opener** | not applicable | 🚫 | banned |

**P0 onboarding questionnaire expansion** = II3, II4, II5, II6, II8 — adds 5–8 minutes to onboarding but every signal feeds matching. Should be ordered after current B3 Faith and before B5 ProfileBasics.

---

## III · Swipe-deck — interaction depth

User intent: *"I want fine-grained control + safety nets."*

| # | Feature | Status | Priority | Notes |
|---|---|---|---|---|
| III1 | **Swipe-to-back / undo last** | 🔴 | **P0** | User asked. Snapchat-style left-to-bring-back-card. Free tier: 1 undo / day. Bless+ unlimited. Triggers haptic Light + 320ms reverse-flight animation. |
| III2 | Card peek / detail open | ✅ | — | tap or long-press |
| III3 | Photo carousel inside detail | 🔴 | P1 | Hinge-style horizontal swipe through multi-photo profile. |
| III4 | Read more (long bio) | 🟡 | P1 | Currently truncates, no "see more" affordance. |
| III5 | Compatibility ribbon ("You both ❤ Tim Keller") | 🔴 | P2 | Surface 1–2 shared answers/tags. |
| III6 | **Boost** (force-show my profile to top of others' decks) | 🔴 | P2 | Bless+ feature. Cooldown 7 days. |
| III7 | **Why this match?** explanation | 🔴 | P1 | "We picked Mariana because you both rate weekly mass + classical music." Pastor-tone copy. |
| III8 | Streak counter / "you've matched 3 days in a row" | 🚫 | banned | engagement-loop |
| III9 | **No-match floor** (1 day = no decisions = "Take a Sabbath") | 🔴 | P2 | Cathedral-Light positive: rest-day mode. |

---

## IV · Conversation depth

User intent: *"Hold context, send something more than text, keep it safe."*

| # | Feature | Status | Priority | Notes |
|---|---|---|---|---|
| IV1 | Real-time delivery | 🟡 | P1 | 5s polling; v1.1 socket.io |
| IV2 | Typing indicator | 🚫 | banned | anxiety pattern |
| IV3 | Read receipts toggle | ✅ | — | privacy screen |
| IV4 | **Send a verse from picker** (in-chat) | 🔴 | **P0** | Replace anchor-only model. Tap "+ verse" → pastor-curated list → send as styled message. |
| IV5 | **Send a prompt question** | 🔴 | P1 | "Ask Mariana: A verse that holds you?" — opens prompt picker. |
| IV6 | Photo / GIF in chat | 🔴 | 🚫 | photo: defer; GIF: banned |
| IV7 | Voice note | 🔴 | P2 | Defer; safety review needed. |
| IV8 | Mute conversation | 🔴 | P1 | Disable push from one thread. |
| IV9 | Search inside conversation | 🔴 | P2 | |
| IV10 | **Date suggestion / "let's meet"** card | 🔴 | P1 | Structured prompt ("Coffee Sunday after Mass?") with location + time chips. |
| IV11 | Pastor-flagged conversation banner | 🟡 | P0 | Sheet variant=pastor exists; trigger missing. |
| IV12 | Save / star a message | 🔴 | P2 | |
| IV13 | Schedule a call | 🔴 | P2 | Defer; v1.1 |

---

## V · Safety + verification

| # | Feature | Status | Priority | Notes |
|---|---|---|---|---|
| V1 | Report | ✅ | — | wired |
| V2 | Block | ✅ | — | wired |
| V3 | Pause profile | ✅ | — | settings |
| V4 | **Photo verification (blue check)** | 🔴 | **P0** | Live selfie + AWS Rekognition compare. Already in API stack. Show check on profile. |
| V5 | **ID / identity verification** | 🔴 | P1 | Bless+ feature; manual review. |
| V6 | **Background check** | 🔴 | P2 | Defer; needs vendor (Garbo etc.). v1.2+ |
| V7 | **Safe-meet checklist** | 🔴 | P1 | Pre-first-meet sheet w/ public-place + tell-friend tips. Pastor-approved copy. |
| V8 | Emergency contact | 🔴 | P2 | "Notify [contact] when I'm meeting [match]." |
| V9 | **Account flagged banner** | 🔴 | P0 | Server returns `account_flagged` → top banner across AppShell. |
| V10 | **Pastor escalation modal trigger** | 🟡 | P0 | Sheet variant exists; server signal missing. |

---

## VI · Page transitions + animation

User intent: *"App should feel calm but alive."*

| # | Surface | Today | Priority | Spec |
|---|---|---|---|---|
| VI1 | Stack push (auth → onboarding) | RN default | — | OK |
| VI2 | Tab swap (Today ↔ Conversations ↔ You) | instant | **P0** | 200ms cross-fade w/ 4pt vertical lift on incoming tab |
| VI3 | Settings sub-screen open | instant | **P0** | Slide-in from right · 320ms ease-emphatic. Back = mirror |
| VI4 | Sheet open (full / half) | RN Modal default | 🟡 | Reanimated translate w/ drag-handle + spring-down dismiss |
| VI5 | MatchSheet ceremony | 560ms emphatic ✅ | — | OK |
| VI6 | Card swipe commit | 320ms ✅ | — | OK |
| VI7 | Card peek-to-detail | RN Modal slide ✅ | 🟡 | Could add shared-element from card photo to sheet hero |
| VI8 | **Onboarding step-to-step** | RN stack | **P0** | Fade + 8pt vertical lift · 320ms emphatic. Reinforces ceremony. |
| VI9 | **Verse interlude reveal** | restock animation ✅ | — | OK |
| VI10 | **Reduced-motion fallback** | partial | P0 | Audit every animation: cross-fade 200ms when system flag set |

---

## VII · Engagement (Cathedral-Light variant)

User intent: *"Feel like the app respects my time, not steals it."*

| # | Feature | Status | Priority | Notes |
|---|---|---|---|---|
| VII1 | Daily verse anchor | ✅ | — | Today screen header |
| VII2 | Streak counter | 🚫 | banned | dopamine loop |
| VII3 | Push for new match | 🟡 | P1 | scaffold ready, server delivery pending |
| VII4 | Push for new message | 🟡 | P1 | same |
| VII5 | **Heart-of-Week** | 🔴 | P1 | Bless+ feature. Server picks 1 person/week as your Heart-of-Week. Slot above daily deck. |
| VII6 | **Sabbath day** ("take a rest") | 🔴 | P2 | Optional opt-in: every 7th day, deck shows verse + "Rest. We'll see you tomorrow." No swipe. |
| VII7 | Onboarding success ceremony | ✅ | — | Done.tsx |
| VII8 | First-match ceremony | ✅ | — | MatchSheet |
| VII9 | First-message ceremony | 🔴 | P2 | one-time fanfare for first chat reply |
| VII10 | **Walking-with-one-another monthly retro** | 🔴 | P2 | "Since {date}, you walked with 14 people, sent 23 verses." pastor-toned. Bless+. |

---

## VIII · Compliance + trust

| # | Feature | Status | Priority | Notes |
|---|---|---|---|---|
| VIII1 | Holy Code consent | ✅ | — | onboarding covenant |
| VIII2 | Privacy policy + ToS | 🟡 | P0 | static URLs needed in About screen |
| VIII3 | Data export (GDPR/UU PDP) | ✅ | — | wired |
| VIII4 | Account deletion (hard delete) | ✅ | — | wired |
| VIII5 | **Cookie / consent surface (web)** | 🔴 | not applicable | mobile only |
| VIII6 | **App Store data-collection disclosure** | 🔴 | **P0 pre-launch** | required for App Store submission |
| VIII7 | **Age-verification audit log** | ✅ | — | server-side |
| VIII8 | **Indonesian PDP compliance** | 🟡 | P1 | mostly covered by GDPR shape; double-check w/ legal |

---

## IX · Performance + reliability

| # | Surface | Status | Priority | Notes |
|---|---|---|---|---|
| IX1 | Cold-start time | unmeasured | P1 | target <2.5s on iPhone 13 |
| IX2 | Image lazy-load | RN Image default | P1 | implement progressive blur-up |
| IX3 | Offline mode | OfflineBanner ✅ | P1 | needs queue-replay for sent messages |
| IX4 | Retry-with-backoff on API | 🔴 | P1 | 3 attempts · 1s/3s/9s |
| IX5 | Crash reporting | Sentry installed | 🟡 | needs DSN config |
| IX6 | Analytics | PostHog ✅ | — | events flowing |
| IX7 | Accessibility audit | partial | P1 | VoiceOver pass on every screen |
| IX8 | Reduced-motion respect | partial | P0 | covered in VI10 |

---

## P0 build queue (next sprint)

In priority order:

1. **I1 Preview my profile (eye-icon toggle in EditProfile)** — fastest win
2. **I2 + I10 Photo manager** (8 photos, add/remove/reorder/primary/highlight)
3. **I3 Highlight pin** (gold-rule indicator)
4. **I4 Edit prompts** (3 from curated pool)
5. **I6 Edit faith details (full)** — re-take questionnaire from settings
6. **II3–II8 Onboarding question expansion** (marriage timeline, attendance, practice tags, welcomed tags) — 5 new screens
7. **III1 Swipe-to-back / undo** — 1 free undo / day
8. **VI2, VI3, VI8 Page transitions** — tab fade · settings slide-in · onboarding step fade
9. **IV4 Send-a-verse picker in chat**
10. **V4 Photo verification flow**
11. **V9 + V10 Account-flagged banner + pastor-escalation trigger**
12. **VI10 Reduced-motion audit + fallback**

## P1 (post-pre-alpha launch)

I5, I7, I11, II7, II10, II11, III3, III4, III6, III7, IV1 (socket.io), IV5, IV8, IV10, IV11, V5, V7, VII3, VII4, VII5, VIII2, VIII6, VIII8, IX2, IX3, IX4, IX7

## P2 (later)

I8, II13, III5, III9, IV6 (photo only), IV7, IV9, IV12, IV13, V6, V8, VII6, VII9, VII10

## Banned (Holy Code §HCoC)

I9, IV2, IV6 (GIF), VII2, "they viewed you", "online now", typing indicator, infinite restock, confetti, hearts-fly, scale-pop, em dashes, AI-generated faces, gradient text.

---

## Summary table — what changes for the user

| If we ship P0 only | Pre-alpha tester sees |
|---|---|
| Profile preview + 8-photo manager | "I can groom my profile properly." |
| Edit prompts | "I can show personality, not just bio." |
| Onboarding II3–II8 expansion | "It's clear they care about faith fit." |
| Swipe-to-back | "I won't accidentally lose someone." |
| Page transitions | "App feels alive, not jumpy." |
| Send-a-verse picker | "I can lead with scripture, not text." |
| Photo verification | "I can trust this profile is real." |
| Account-flagged banner | "I know if I broke a rule." |

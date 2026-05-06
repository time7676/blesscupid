# DESIGN.md — BlessCupid Mobile Design System

> Canonical design system for the mobile app. Mirrors the live runtime tokens in `apps/mobile/src/lib/design-system/tokens.ts` and the prototype CSS export in `docs/design/system-v1/tokens.css`. **Tokens are the source of truth** — never hand-author hex values in screens; reach into `tokens.ts`.

## Direction

**Garden Hours.** The production form of Cathedral Light: dawn light through a chapel window, then tea after church. Warm parchment surfaces, ink for text, sandstone-warm section fills, communion gold for sacred emphasis, and amber-ink for selected or warning states. No reds, no pinks, no neon.

## Color strategy

**Restrained**, with one committed move: primary controls are ink-black. Amber carries selected states, focus accents, and warning language. Gold is reserved for sacred moments (verse-of-day, match confirmation, brand wordmark) and never used as a UI control fill.

Cobalt remains defined in tokens for legacy prototypes and future secondary surfaces, but it is retired from user-facing v1.1 app chrome. Do not use cobalt for primary CTAs, active tabs, selected chips, or headline emphasis in new screens.

### Palette (OKLCH-equivalent, mirrored from `tokens.ts`)

| Role | Token | Hex | Usage |
|---|---|---|---|
| Ink (body text) | `color.ink.default` | `#1A1A24` | All primary copy |
| Ink soft | `color.ink.soft` | `#3F3F4A` | Secondary copy, helper |
| Ink charcoal | `color.ink.charcoal` | `#14181F` | Highest-contrast headers, modal scrim |
| Parchment (canvas) | `color.parchment.default` | `#FAF7F0` | App background |
| Parchment raised | `color.parchment.raised` | `#FFFDF7` | Cards, sheets, profile surfaces |
| Sandstone | `color.sandstone.default` | `#F4ECDF` | Section bands, quiet hero fills |
| Sandstone warm | `color.sandstone.warm` | `#FBF3E2` | Verse-of-day card fill |
| Gold | `color.gold.default` | `#C8A24B` | Wordmark, gold rule, sacred accent only |
| Gold halo | `color.gold.halo` | `rgba(200,162,75,0.18)` | Behind hero typography, never on controls |
| Cobalt 700 | `color.cobalt[700]` | `#243F7A` | Reserved for legacy prototypes and future secondary surfaces |
| Cobalt 500 | `color.cobalt[500]` | `#3D67B8` | Reserved. Do not use for v1.1 primary CTA or active tab |
| Cobalt 100 | `color.cobalt[100]` | `#D6E0F4` | Reserved. Do not use for v1.1 selected chips |
| Success 500 | `color.success[500]` | `#5C8A6A` | Send-confirmed, verified pass, positive moderation |
| Warning 500 | `color.warning[500]` | `#D08A2C` | Amber for caution. **Never red.** Holy Code §HCoC |
| Hairline | `color.hairline.default` | `rgba(26,26,36,0.12)` | Default 1px divider |

**Banned.** `#FF0033` swipe-card red, neon pink, Tinder gradient orange→pink, any hex outside the table. Pure `#000` and `#fff` are also banned — every neutral is tinted toward parchment/ink.

## Typography

Two families. No third.

- **Serif identity.** Cormorant Garamond (variable). Use for: hero copy, screen titles, verse text, profile name, headline emphasis. Pair italic emphasis with amber-ink (`color.warning[700]`) in v1.1.
- **Sans body + UI.** Inter (variable). Use for: body, helper, labels, eyebrow caps, buttons, tabs, every input.

### Type scale (live tokens)

| Step | Size | Line | Tracking | Use |
|---|---|---|---|---|
| Hero | 38px | 1.04 | -0.012em | Auth Welcome only |
| H2 | 26px | 1.18 | -0.012em | Today greeting, profile name |
| H3 | 22px | 1.35 | -0.012em | Section headers, modal titles |
| Body Lg | 16px | 1.55 | 0 | Lede, body in profile detail |
| Body | 14px | 1.55 | 0 | Default app body |
| Label | 13px | 1.25 | 0.02em | Form labels, button labels |
| Caption | 12.5px | 1.55 | 0 | Helper, legal, metadata |
| Eyebrow | 11px | 1.25 | 0.2em (uppercase) | Section eyebrows ("TODAY · WEDNESDAY 6") |

Scale ratio ≥1.25 between consecutive steps. Cap body line length at ~32em on phone (~360px text column).

## Spacing scale

Strict 4px grid. Use named tokens, never raw px.

`s0 0 · s1 4 · s2 8 · s3 12 · s4 16 · s5 20 · s6 24 · s7 32 · s8 40 · s9 56 · s10 72`

**Rhythm rule.** Vary spacing intentionally. Verse-of-day card uses s7 above + s5 below. Bottom-tab safe inset is s8 minimum on home-indicator devices. Same padding everywhere is monotony.

## Radius

| Token | Value | Use |
|---|---|---|
| `xs` | 2px | Inline tags |
| `sm` | 4px | Form inputs, segmented control |
| `md` | 6px | Toast |
| `lg` | 12px | Default card, button |
| `xl` | 20px | Profile photo card, verse card |
| `xxl` | 28px | Match-confirmation hero card, profile-detail full sheet |
| `pill` | 999px | Chips, eyebrows-with-bg, tradition badges |
| `circle` | 50% | Avatars, icon buttons |

Default card radius is **`lg` (12px)** for product chrome and **`xl` / `xxl`** for sacred moments. Don't mix radii within a row.

## Elevation

Restrained. Three steps total.

| Token | Value | Use |
|---|---|---|
| `raise` | `0 1px 0 rgba(26,26,36,0.04)` | Inactive resting cards |
| `card` | `0 1px 2px rgba(20,24,31,0.06)` | Default card lift |
| `modal` | `0 12px 32px rgba(20,24,31,0.18)` | Bottom sheets, full-screen modals |

No glows, no neumorphism, no inset shadows.

## Motion

Calm, never snappy.

| Token | Duration | Curve | Use |
|---|---|---|---|
| `instant` | 80ms | standard | Press states |
| `gentle` | 200ms | standard | Tab swap, chip selection |
| `intent` | 320ms | emphatic | Card swipe, sheet present |
| `ceremony` | 560ms | emphatic | Match confirmation, verse reveal |

`ease-emphatic = cubic-bezier(0.2, 0.7, 0.2, 1)`. **Banned.** Spring-bounce (reads flirty), infinite loops (compulsive), confetti, hearts-fly, scale-pop on match. Reduced motion = instant fade swap, no translate.

## Iconography

Custom line set, single-stroke 1.5px. Default size 20px in nav, 24px in content. **No filled emoji-style icons.** **No literal religious iconography in nav** (no crosses on home, no doves on chat). Sacredness lives in typography and pacing, not icons.

Tradition badges (cross / fish / dove) only as user self-identification on profile, never decorative chrome.

## Component canon

Components live in `apps/mobile/src/lib/design-system/components/`. Every screen reaches for these before authoring inline styles.

- `Button` — variants: `primary` (ink fill), `secondary` (parchment-raised + hairline), `ghost` (text-only with gold underline). Press = 1px translateY + slightly darker fill.
- `FormInput` — labels above, helper below, error pill underneath. Border `hairline` resting → `warning.700` focus → `warning.500` error.
- `RadioCard` — pill chip style for single-select (faith tradition, orientation). Selected = warning-100 fill + warning-700 border.
- `VerseCard` — sandstone-warm fill, `xl` radius, gold rule + serif italic for the verse line.
- `ScreenHeader` — eyebrow caps + serif title + optional back chevron, no center alignment.
- `BottomNav` — four tabs max. Ink for active icon + 9px caps label. No badge dots that re-engage compulsively.
- `Sheet` — bottom sheet with `xxl` radius, `modal` shadow, drag handle 36×4 hairline.
- `GoldRule` — 56px × 1.5px gold line. Reserved for sacred moments. Never decorative chrome.

## Layout primitives

- **App canvas.** `parchment.default`. Safe insets respected; never paint to absolute edge except hero artwork blocks.
- **Edge gutter.** s7 (32px) on phone width. Profile detail uses s5 inside content blocks for readability.
- **Section band.** `sandstone.default` with s7 padding for visual section breaks (verse-of-day, "Three for Today").
- **Tap target minimum.** 44×44pt. Pill chips meet via `s3` vertical + `s5` horizontal padding at body-lg size.
- **Cards are not the lazy answer.** Use them when they're truly the best affordance (one match per swipe). Avoid nested cards always.

## Anti-patterns (refuse + rewrite)

- **Side-stripe borders** as accents — refuse.
- **Gradient text** via `background-clip` — refuse. Emphasis via weight + cobalt-700.
- **Glassmorphism** as default — refuse. Only purposeful, rare uses.
- **Hero-metric template** (big number + small label + gradient accent) — refuse. We're not a SaaS dashboard.
- **Identical card grids** — refuse. The Today screen earns variation: verse card → singular hero match → small dock of "later today."
- **Modal-as-first-thought** — refuse. Sheet beats modal; inline beats sheet.
- **Em dashes** in copy — banned. Use commas, colons, periods, or parentheses.
- **AI-generated faces** anywhere, including mockups. Placeholders use abstract gradients + initials.

## Theme

Light only at v1. Dark mode is post-launch. Justified scene sentence: "A 32-year-old single Christian opens the app at 7:30am over coffee, in a sun-lit kitchen, before morning prayer." Cathedral Light. Dark mode would invert that scene — out of scope until after Apr 2026 launch.

## Accessibility floor

- WCAG AA contrast on all body text (parchment + ink ≥ 7:1 — Cathedral Light is generous here).
- Tap targets 44×44pt minimum; chips meet via padding.
- All interactive controls have `accessibilityRole` + `accessibilityLabel`.
- Reduced motion supported globally; `motion.intent` falls back to fade.
- Focus rings `warning.700` (#A66A1F amber-ink) at 2px outside, never removed. **Cobalt retired** for v1 chrome per Color strategy; focus ring switched from cobalt-500 to amber-ink to keep token discipline.

## Mode discipline (v1)

Two modes coexist. Every screen, sheet, and component declares which it lives in. Confusing them makes the product feel sloppy.

- **Sacred mode.** Verse rail, MatchSheet, StatusComposer success, VerifySelfie success, OnboardingDone, ThreadAnchor card, GoldRule moments. Cormorant serif. Sandstone-warm or parchment-raised surface. Gold accents. `ceremony` motion (560ms). Quiet copy, no exclamation marks, no emoji.
- **Utility mode.** Forms, settings rows, lists, ListItem, FormInput, BottomNav, badges, banners, error toasts, admin web app. Inter sans. Parchment-raised. Ink primary. `gentle` or `instant` motion. Copy is direct, action-first, terse.

Cards may render utility content inside a sacred container (e.g., StatusComposer = sacred chrome around utility list of theme chips), but never the inverse.

## v1 additions to canon

### Color additions

| Role | Token | Hex / Spec | Usage |
|---|---|---|---|
| Gold ring (status halo) | `color.gold.ring` | `rgba(200,162,75,0.35)` | 4pt outer + 2pt inset gap around profile photo when subject has active StatusVerse. Distinct from `gold.halo` (behind-typography only). |
| Ink scrim | `color.ink.scrim` | `rgba(20,24,31,0.42)` | Bottom sheet backdrop scrim. Matches `ink.charcoal` opacity-tuned. |
| Camera viewfinder fill | `color.parchment.viewfinder` | `#F7F3EA` | Reserved for CameraSheet inside frame, sandstone-adjacent neutral. |

### Typography rules (locale)

- Cormorant Garamond covers ID Latin diacritics natively. Use as-is for both EN + ID.
- Inter handles ID. No second Bahasa typeface needed.
- Server-rendered verse text must include attribution per translation: NIV (EN) / LAI TB (ID). Display attribution in `Eyebrow` 11px caps after the verse.
- Locale switch is a runtime concern: components consume strings via `t('key.path')` from i18next. Never hardcode text.
- ID copy can run ~15% longer than EN. Layout must absorb this without truncation: prefer wrap over ellipsis for body and headings; only `Caption` and `Label` may truncate.

### Distance copy pattern

| Distance bucket | EN copy | ID copy |
|---|---|---|
| ≤5km | "near you" | "dekat dengan kamu" |
| 5–10km | "nearby" | "tidak jauh" |
| 10–20km same city | "in {city}" | "di {city}" |
| 20+km | "far from {city}" | "jauh dari {city}" |

Server returns `distanceBucket` enum + `proximityHint` boolean (`near | same_city | different_city`). Mobile composes copy via i18n. Raw lat/lng/km never exposed.

### Status verse ring spec

- Trigger: subject has active `StatusVerse` row.
- Render: 4pt `gold.ring` ring around profile photo, 2pt inset gap inside the ring (gap matches photo background), photo radius unchanged (`xl` on swipe card, `circle` on avatar).
- Tap interaction: photo tap → `intent` motion expands a sacred-mode overlay with verse + reference Eyebrow.
- Reduced motion: tap → instant fade to overlay, no scale.
- Never paired with verified badge inside the same ring; verified badge sits top-right outside ring.

### Push notification typography

- Title: Inter Body 14 (system-rendered, Apple/FCM constraints).
- Body: truncate to 100 chars + ellipsis. Verse text inside body uses straight quotes (no curly) to survive APNs encoding.
- Collapse-id grouping: when ≥3 same-kind events within 5min, collapse to single Inter Body 14 line ("3 new matches today"). Drop verse text in collapsed form.

### Reduced motion fallbacks

| Sacred moment | Default | Reduced motion |
|---|---|---|
| MatchSheet | 560ms ceremony (gold halo pulse + photo slide + name fade) | 200ms cross-fade only |
| StatusVerse ring on tap | `intent` scale + fade | instant fade |
| OnboardingDone | 4s auto-advance + Cormorant fade-in | instant render, manual tap to advance |
| Verse interlude every 5 swipes | 1.6s full-bleed verse card | static card, dismiss on tap |
| Card swipe deck | spring-back on incomplete swipe | snap to position |

### Component canon — v1 additions

Components live in `apps/mobile/src/lib/design-system/components/`.

- **`CameraSheet`** — full-bleed sheet variant for VerifySelfie. Outer chrome reuses `Sheet` (`xxl` radius top, `modal` shadow). Inside: `parchment.viewfinder` viewfinder frame at `xxl` radius, gold pulse-on-tap on capture button. Loading state = parchment skeleton w/ "Checking…" Caption. Success = gold halo + Cormorant "Verified" + auto-dismiss 1.2s. Camera-denied state = system-settings deep-link CTA.
- **`PermissionPrompt`** — utility-mode pre-prompt sheet. Props: `kind: 'camera' | 'photos' | 'location' | 'notifications'`. Cormorant H3 reason + Inter Body 14 specifics + ink Continue button → triggers system prompt. Dismiss → app degrades gracefully (city dropdown, library upload, in-app feed only). Single canonical copy per kind, localized.
- **`OTPInput`** — 6 boxes parchment-raised, Cormorant numerals 26px, hairline borders, auto-advance, paste-aware, 56pt boxes. Active box = warning-700 border. Error = warning-500 border + amber inline message above. Used in EmailVerify + ResetConfirm.
- **`ProgressDots`** — 8 ticks for onboarding cards. Filled = `gold.default`. Unfilled = `hairline.default`. 4pt diameter, s2 gap.
- **`WhimsicalCard`** — onboarding pattern. ScreenHeader (back chevron, hidden on card 1) + Eyebrow "STEP {n} · {whimsy|essential}" + ProgressDots + Cormorant H2 question + illustrated centerpiece (parchment + gold accents, no AI faces) + Body Lg supporting line + 2–4 chips arranged as 2-up grid (`pill` radius, `sandstone.warm` fill, ink text, gold border on tap) + ink Continue button bottom-safe-inset.
- **`StatusRing`** — render ring around any photo when subject status set. Composable with `Avatar`, `SwipeCard.photo`, `ProfileHeader.photo`. Props: `active: boolean`. No-op when false.
- **`ThemeChip`** — 12 verse themes (peace, joy, strength, love, wisdom, comfort, praise, purpose, forgiveness, gratitude, hope, faith). Inter Label, `pill` radius, ink-soft text on parchment-raised, gold border + warning-100 fill on selected.
- **`VersePickerList`** — opens after ThemeChip tap. Vertical list of 6–8 verses for chosen theme. Each row: Cormorant verse Body Lg (italic) + reference Eyebrow + tap target full-width. Selected row = sandstone-warm fill + gold left rule (4pt × full row height).
- **`UndoToast`** — Bless+ premium affordance. Bottom-floating, parchment-raised, `md` radius, `card` shadow. Inter Body 14 ink: "Blessed {name} — Undo". Tap "Undo" link (Inter Label, ink) → DELETE last MatchDecision row + restore card. Auto-dismiss 5s. Free users do NOT see this.
- **`UpgradeSheet`** — single-tier sacred-mode sheet. Drag handle + brand wordmark + Eyebrow "BLESS+" + Cormorant H2 + 4 feature rows (gold check icon + ink-soft Body) + PriceCard (sandstone-warm, gold rule, cycle picker chips, big Cormorant price, Caption fine-print) + ink Subscribe button + ghost "Restore purchase". No countdown timer, no scarcity copy.
- **`NotificationFeedRow`** — utility-mode list row. Avatar 40 + Cormorant H3 22 title + Caption time-ago + Body 14 1-line preview + gold dot 6pt unread indicator (right-aligned). Tap → deep-link via push payload routing.
- **`CrisisCard`** — SafetyCenter region-aware row. Eyebrow "{region}" + Cormorant H3 hotline name + Body 14 number/URL + Inter Label CTA ("Call" / "Open"). Reads from `data/crisis-resources.{en,id}.json` keyed by `User.countryCode`.
- **`Banner`** — full-width status row top of scroll area. Variants: `info` (ink-soft fill), `success` (gold rule above), `warning` (amber fill, `warning.500`). Optional CTA right (Eyebrow link). Persistent until acknowledged.
- **`SuggestionChip`** — chat composer opener templates. Inter Label, `pill` radius, sandstone fill, scroll horizontal above keyboard. Tap = pre-fills composer with verse-share template (`Message.kind='verse_share'`). Refresh icon at right end re-rolls templates.
- **`AdminListRow`** — utility-mode (admin web app only). Different visual rhythm: dense, monospace fields for IDs, action buttons inline. Lives in `apps/admin/`, separate component lib but borrows tokens.

### Sacred-moment registry (v1)

Reserved for these moments only. Outside this list = utility mode.

| Moment | Trigger | Vehicle | Duration |
|---|---|---|---|
| MatchSheet | Mutual like committed | Sheet variant=match + GoldRule + Cormorant names + verse anchor | 560ms |
| StatusVerse set | User picks new status | Toast "Status set" + StatusRing appears on profile photo | gentle (200ms) |
| Verified | Selfie face-match ≥90 (or admin approve) | Gold halo + Cormorant "Verified" overlay | 1.2s |
| OnboardingDone | Card 8 submit | Full-bleed Cormorant Hero + first verse + Open Today button | 4s auto-advance |
| Verse interlude | Every 5 commits in swipe deck | Full-bleed verse card | 1.6s |
| Bless commit | User taps Bless on swipe card | GoldRule sweep behind name + soft chime (haptic only, no audio) | gentle (200ms) |

No other surfaces use Cormorant Hero, GoldRule, or `ceremony` motion.

### Holy Code anti-patterns reaffirmation (v1)

These are bans, not preferences. CI lint check enforces.

- No read receipts on messages.
- No typing indicators / "is typing now" presence.
- No "they viewed your profile" notifications or badges.
- No countdown timers, urgency copy, or "limited time offer" framing.
- No bell/ding audio on match. Haptic only.
- No bell-dot badge on Today tab (re-engages compulsively). Other tabs may badge unread state.
- No red anywhere. Amber for warning. Errors render with `warning.500`, never red.
- No emoji as design elements. Tradition badges only as user self-id, never decoration.
- No literal religious iconography in nav. Sacredness lives in typography and pacing.
- No AI-generated faces in mockups, marketing, or seed data. Use abstract gradients + initials placeholder.
- No happy-talk / self-congratulatory copy ("we believe…", "our mission is…"). Direct only.
- No card-mosaic on Matches tab. Two-section list with gold dot unread, no grids.

### Accessibility floor (v1 expansion)

- Verse references expanded for screen readers: `Phil 4:6` reads "Verse from the book of Philippians chapter 4 verse 6". Implement in `<Verse ref={...}>` wrapper.
- Reduced motion respected globally; sacred ceremonies degrade per fallback table above.
- Cormorant heading dynamic-type cap +25% to preserve hierarchy. Inter body uncapped.
- All `accessibilityLabel` strings localized via i18next.
- VoiceOver swipe action order: Pass → Bless → Super (matches visual deck).

### Orientation + theme

- **Portrait only.** Hard-pin via `app.json` orientation lock. Tablet/landscape deferred v1.1.
- **Light only.** Garden Hours is parchment-default. Dark mode deferred v1.1.

### Spacing additions

- Bottom-safe inset on every screen with action button: minimum `s8` (40px) above home-indicator devices, `s5` (20px) on devices without home indicator.
- Sheet drag handle margin: `s3` top from sheet edge.
- WhimsicalCard chip grid: `s4` gutter between chips, `s5` margin from container edges.

### v1 component reuse table

| Surface | Composes |
|---|---|
| Auth screens (A1–A6) | `Button`, `FormInput`, `OTPInput`, `Banner`, `ScreenHeader` |
| Onboarding cards (B1–B8) | `WhimsicalCard`, `ProgressDots`, `Button`, `PermissionPrompt`, `Sheet` (B9 OnboardingDone) |
| Today | `SwipeCard`, `ActionDeck`, `StatusRing`, `Eyebrow`, `Banner`, `VerseCard` (interlude), `UndoToast` |
| Matches | `ListItem`, `Eyebrow`, `Chip`, `Button` (gated) |
| Chats | `ListItem`, `Avatar`, `StatusRing`, `Banner` (offline) |
| Thread | `MessageBubble` (text + verse_share variants), `Composer`, `SuggestionChip`, `VerseCard` (anchor), `Banner` (blocked / flagged) |
| You | `ProfileHeader`, `StatusRing`, `ListItem`, `Button` (CTA), `Eyebrow` |
| ProfileDetail | `Sheet`, `PhotoCarousel`, `StatusRing`, `VerseCard`, `Chip`, `Button`, `GoldRule` (Common ground) |
| MatchSheet | `Sheet` variant=match, `GoldRule`, `VerseCard`, `Button` |
| StatusComposer | `Sheet` variant=picker, `ThemeChip`, `VersePickerList`, `Button` |
| VerifySelfie | `CameraSheet` (NEW primitive), `Button`, `Banner` |
| UpgradeSheet | `Sheet` variant=upsell, `Button`, `Chip` (cycle picker) |
| ReportSheet | `Sheet` variant=confirm, `RadioCard`, `FormInput`, `Button` |
| BlockConfirm | `Sheet` variant=confirm, `Button` |
| NotificationsSheet | `Sheet` variant=list, `NotificationFeedRow`, `Eyebrow` |
| Settings sub-screens | `ListItem`, `FormInput`, `Toggle`, `RadioCard`, `Button` |
| SafetyCenter | `CrisisCard`, `ListItem`, `Cormorant H3` |
| Admin web (separate app) | `AdminListRow`, ink + amber tokens only, no sacred-mode at all |

## Component state matrices

### Button states

| State | Spec |
|---|---|
| Default (primary) | Ink fill, parchment-raised text, `lg` radius, height 48pt, h-padding s5 |
| Default (secondary) | Parchment-raised fill, hairline border, ink text |
| Default (ghost) | No fill, ink text, optional gold underline on hover/press |
| Default (destructive) | `warning.500` amber-ink fill, parchment-raised text. **Never red.** Used for AccountDelete, Block confirm |
| Pressed | translateY(1px) + 8% darken via overlay (`rgba(0,0,0,0.08)`), `instant` (80ms) |
| Disabled | opacity 0.4, no press response, cursor not-allowed (web) |
| Loading | spinner replaces label, button width frozen at last-rendered, dot-pulse spinner ink-soft |
| Icon-only | 44×44pt circle, ink stroke 1.5px |

### FormInput states

| State | Spec |
|---|---|
| Default | Border `hairline.default`, fill parchment-raised, label Inter Label above (s2 gap), helper Caption below (s1 gap) |
| Focus | Border `warning.700` 1.5px, label tints `warning.700` |
| Error | Border `warning.500`, error pill below replaces helper (Caption + amber dot icon left) |
| Disabled | Fill `parchment.default`, ink-soft text, no caret |
| Read-only | Fill `parchment.default`, ink default text, no caret, no border highlight |
| Char counter | Caption right-aligned in helper row, format `{n}/140`, turns `warning.500` at 90% |
| Autofill (iOS) | Override yellow tint via `WebkitBoxShadow: inset 0 0 0 1000px parchment-raised` |
| Number-pad | Same chrome, system numeric keypad, no decimals for IDR |

### MessageBubble states

| State | Mine | Theirs |
|---|---|---|
| Default | Ink fill, parchment-raised text, `lg` radius (top-right inset to `sm`), right-aligned | Sandstone fill, ink text, `lg` radius (top-left inset to `sm`), left-aligned |
| Sending | 60% opacity, tiny clock icon trailing | n/a (theirs always arrives delivered) |
| Queued (offline) | 60% opacity, dotted border, "queued" Caption below | n/a |
| Failed | Amber border + retry chip below ("Tap to retry") | n/a |
| Blocked (sender) | Hidden (not persisted) — sender sees toast "Message can't be sent" instead | n/a |
| Verse-share | Gold rule top + Cormorant verse Body Lg italic + ref Eyebrow + sender Eyebrow ("{name} sent a verse"). Bubble fill = sandstone-warm. | Same chrome, theirs alignment |
| Long-press | Reveals menu: Copy text · Report message · Block user. Sheet variant=confirm. |

### SwipeCard spec

- Aspect ratio: photo area 4:5, info overlay below
- Photo radius: `xl` (20px) corners, full-bleed inside card
- Info overlay: gradient mask bottom 30% (parchment.raised → transparent) for legibility
- Stack visual: 2 cards behind active (z-index, 4pt offset Y, 2% scale shrink)
- Card peek: bottom card visible 8pt below active during settle
- Tap (no-swipe): opens ProfileDetailSheet
- Swipe pass: translate-x −80vw + rotate −12deg + fade 0.4s
- Swipe bless: translate-x +80vw + rotate +12deg + fade 0.4s
- Swipe super: translate-y −60vh + scale 0.96 + fade 0.5s
- Swipe-back undo (Bless+ only): reverse animation 0.32s
- Reduced motion: instant fade between cards, no rotate

### ActionDeck spec

- 3 buttons: Pass (left, 56pt) · Bless (center, 80pt, open-palm icon, gold accent) · Super (right, 56pt, star icon, amber)
- All circular (`circle` radius), parchment-raised fill, hairline border, `card` shadow
- Bless button has subtle gold halo behind icon (4pt outer ring at `gold.halo`)
- Tap target 44×44pt minimum honored via padding
- Haptic: light impact on Pass/Super, medium impact on Bless
- Disabled (quota cap hit): opacity 0.5, tap → UpgradeSheet
- Spacing between buttons: s5 (20pt)
- Position: `s8` from bottom safe inset

### Avatar component

| Size | Token | Pixels | Use |
|---|---|---|---|
| sm | `avatar.sm` | 24 | NotificationFeedRow |
| md | `avatar.md` | 40 | ListItem (Chats, Matches, Blocked) |
| lg | `avatar.lg` | 56 | ProfileHeader, MatchSheet sides |
| xl | `avatar.xl` | 72 | ProfileDetailSheet header (no carousel) |
| hero | `avatar.hero` | 96 | OnboardingDone |

Fallback: abstract gradient (sandstone → gold-halo) circle + Cormorant initial centered (28pt at md, 40pt at lg, 56pt at xl). No AI faces, no stock photos.

### Photo + PhotoCarousel

- Default photo aspect: 4:5 portrait
- Loading: parchment skeleton + ink-soft photo-icon glyph centered, shimmer animation
- Failed-to-load: sandstone fill + ink-soft "Photo unavailable" Caption + retry chip
- Carousel page dots: 4pt circles, ink at 30% opacity unfilled, ink at 100% active, s2 gap, bottom-center s4 from edge
- Carousel swipe: horizontal pan, snap to page, `gentle` motion (200ms)
- Tap photo on swipe card: opens ProfileDetailSheet (NOT carousel — single photo on card)
- Tap photo on ProfileDetailSheet: enters fullscreen viewer
- Long-press: no-op (avoid lossy interactions)

### Verified badge

| Surface | Size | Position | Spec |
|---|---|---|---|
| SwipeCard | 20pt | top-right of photo, s3 inset | Gold check icon on parchment-raised circle, hairline border |
| ProfileDetailSheet header | 24pt | inline next to name | Same chrome |
| Avatar (md) | 14pt | bottom-right corner overlap | 2pt parchment.default background ring around badge |
| Avatar (lg, xl, hero) | 18pt | bottom-right corner overlap | Same |
| ListItem (Matches/Chats) | 14pt | inline after name (Cormorant baseline aligned) | No background ring |

Badge never sits inside `gold.ring` status halo; status ring outermost, badge at photo edge.

### Skeleton / Shimmer

- Base: parchment-raised fill (`parchment.raised`)
- Shimmer gradient: `parchment.raised → sandstone.warm → parchment.raised`, angle 110deg
- Cycle: 1200ms, ease-in-out, infinite
- Reduced-motion: static fill, no animation, no shimmer
- Match the real layout shape, never generic gray bars
- Component-specific skeletons: `SwipeCard.skeleton`, `MessageBubble.skeleton`, `ListItem.skeleton`, `Photo.skeleton`

### Toast spec

- Position: bottom-floating, `s8` above bottom safe inset
- Width: full-width minus `s7` gutter both sides, max-width 480
- Padding: `s4` vertical, `s5` horizontal
- Radius: `md` (6px)
- Shadow: `modal`
- Stack: max 1 (replace, not queue)
- Auto-dismiss: 2400ms
- Swipe-down dismiss: enabled
- Tap: dismiss + execute optional action

| Variant | Fill | Indicator |
|---|---|---|
| neutral | `parchment.raised` | hairline left rule |
| success | `parchment.raised` | gold dot 6pt left, `success.500` rule below |
| warning | `parchment.raised` | amber dot 6pt left, `warning.500` rule below |

### Empty-state pattern

Every empty state has:
- Cormorant italic 1-line (sometimes Body Lg, sometimes H3, sized to surface)
- Inter Body 14 second line (ink-soft)
- Optional primary CTA (Button)
- Optional illustration: hand-drawn ink line on parchment, gold accent permitted
- No emoji, no animation, no spinner
- Tone: pastoral, never punitive

| Surface | Cormorant line | Body line | CTA |
|---|---|---|---|
| Today (no candidates) | "No one nearby today." | "Come back tomorrow, or widen your distance." | "Open preferences" → Settings |
| Matches | "No likes yet." | "Bless someone today and they'll see you here." | "Open Today" |
| Chats | "Your conversations will live here." | "Bless someone in Today to start one." | "Open Today" |
| BlockedList | "You haven't blocked anyone." | — | — |
| Notifications | "Nothing yet." | "The first match always feels like a small miracle." | — |
| Search no-match (Status verses) | "No verses found in this theme." | "Try another theme." | — |

### Pressed-state darken

Universal: pressed state overlays `rgba(0,0,0,0.08)` on top of resting fill. Applies to Button, ListItem rows, Chip, Card. `instant` motion (80ms).

### Pill / Chip / Badge distinction

| Component | Use | Visual |
|---|---|---|
| **Badge** | Static status indicator (Verified, New, Bless+) | Small pill, `pill` radius, Inter Caption (uppercase), s1 vertical / s2 horizontal padding. Color = sandstone fill + ink text default; gold fill + ink text for Bless+ |
| **Chip** | Static metadata tag (tradition, walkStage, distance bucket) | Pill, `pill` radius, Inter Label (mixed case), s2 vertical / s3 horizontal padding. Always sandstone fill. Read-only |
| **Pill** (interactive) | Single/multi-select choice (theme chip, animal chip, gender chip) | Pill, `pill` radius, Inter Label, s3 vertical / s4 horizontal padding. Resting = sandstone-warm; selected = warning-100 fill + warning-700 border |
| **RadioCard** | Larger single-select with description | `lg` radius, parchment-raised + hairline; selected = warning-100 fill + warning-700 border |

### Composer (chat)

- Min height: 44pt single line
- Max height: 6 lines, scroll inside
- Auto-grow on enter (no manual resize)
- Pill radius (`pill`), parchment-raised fill, hairline border
- Send button: 32pt circle, gold fill, ink arrow, right-padded s3
- Send disabled (empty input): 0.4 opacity, no press
- Send loading: spinner replaces arrow
- Suggestion chips row: above keyboard, scroll horizontal, `s4` bottom padding
- Verse-share button: small icon left of input, opens VersePicker inline
- Send animation: gentle slide bubble in from right after API confirm
- Keyboard: keyboard-avoiding, suggestion chips stay visible above keyboard

### Onboarding card transitions

- Forward (next card): translate-x +30% + fade out 200ms (current) → translate-x 0 + fade in 200ms (next), staggered 80ms
- Back (previous): mirror, 150ms total
- Progress dot fill: gold dot scales 0.5 → 1.0 over 200ms when card enters
- Reduced motion: instant cross-fade only

### Status verse expand overlay

When user taps photo with `gold.ring` halo:
- Sacred-mode overlay rises from photo position
- Backdrop: `ink.scrim` fade 200ms
- Card: parchment-raised, sandstone-warm fill, `xxl` radius
- Content: Cormorant italic verse Body Lg + ref Eyebrow
- Position: centered on photo, expands `intent` motion (320ms)
- Dismiss: tap outside, swipe down, or tap again
- Reduced motion: instant fade only

### AccountDeletion confirm sheet

- Cormorant H2: "Are you sure?"
- Body 14: "Your profile, photos, matches, and conversations will be deleted in 30 days. You can sign back in within 30 days to restore."
- FormInput: "Type DELETE to confirm" — exact-match validation, error if mismatch
- Confirm Button: destructive variant (`warning.500` fill, parchment-raised text). **NOT red.**
- Cancel: ghost variant
- Sheet variant=danger uses standard chrome, no extra red treatment

### Number, date, currency formatting

- **Currency (IDR):** `IDR 99,000` — locale `id-ID`, `currencyDisplay: 'code'`, no decimals. Display in UpgradeSheet PriceCard with Cormorant for the price digits.
- **Currency (per locale):** EN locale → `IDR 99,000` (keep IDR for ID market always; no USD conversion).
- **Relative time:** "2h ago", "yesterday", "3d ago", "May 6". Cutoff: < 1h → "Xm ago"; < 24h → "Xh ago"; < 7d → "Xd ago"; older → absolute date `MMM d`.
- **Absolute date format:** ID → `6 Mei`; EN → `May 6`.
- **Counts:** quota = `8 / 10` (space around slash), Inter Body 14 ink-soft.
- **Phone numbers:** stored E.164 (`+62...`); displayed locale-formatted via `libphonenumber-js`.

### Brand assets

- Wordmark: Cormorant Garamond italic, gold (`gold.default`), no underline, no decorative serif additions
- App icon: parchment background + gold open-palm glyph centered, no text
- Splash: parchment background + Cormorant italic "BlessCupid" wordmark fade-in 200ms + system-default loading indicator
- Favicon (admin web): same wordmark glyph mono, ink

### Admin web design (apps/admin/)

Lives outside this canon's mobile-first concerns. Inherits:
- Token colors (parchment, ink, sandstone, warning amber)
- Typography (Inter only — no Cormorant; admin = utility mode always)
- Spacing scale
- Radius (lg max — no xxl in admin)

Admin-specific:
- Sidebar nav (left, 240pt fixed, parchment-raised w/ hairline right border)
- Content area: max-width 1280, parchment.default
- Breakpoints: desktop-first (≥1024 default), tablet (768–1023), mobile (<768) collapses sidebar to drawer
- Dense table rows: 36pt height, hairline dividers
- Action buttons inline in rows (Inter Label sm size)
- No sacred mode anywhere — admin reviews moderation, never displays liturgy
- Cursor: pointer on interactive, default elsewhere
- Focus ring: same `warning.700` 2pt outline

### Onboarding card 7 (verse picker) visual

- Single horizontal carousel of 12 verses (filtered by user's whimsicalAnswers-so-far for affinity)
- Each verse card: sandstone-warm fill, `xl` radius, Cormorant italic verse Body Lg, ref Eyebrow, parchment-raised inner border 1pt
- Card width: 80% of viewport, snap-to-page
- Swipe-back/forward to browse
- Tap card to select → ink check icon appears top-right + selected state
- Continue button only enables after a card selected

### Match state semantics (Matches tab list rows)

| State | Visual |
|---|---|
| New unmatched (likes you, Bless+ only) | Avatar + ink-soft "Bless+ to see" overlay if free user |
| New mutual match | Gold dot 6pt left + Cormorant H3 name + Body 14 last-message preview ("Say hi") |
| Active conversation | Same row, gold dot only when unread |
| Read | Ink-soft dot fades; row remains in section |
| Archived | Ghost row 0.5 opacity, "Archived" Eyebrow tag |

### Spring / animation config

- No spring animations anywhere. Memory-locked: bans bounce. All motion uses `cubic-bezier(0.2, 0.7, 0.2, 1)` (`ease-emphatic`).
- List stagger delay: 40ms between items entering, max 6 items staggered, rest enter together.
- No infinite loops. No pulsing dots. Skeleton shimmer is the only acceptable infinite animation.

### RTL / locale layout

- Bahasa Indonesia + English are both LTR. RTL not supported v1. Layout primitives assume LTR throughout.
- Document for future: when adding RTL locales (Arabic, Hebrew), flip horizontal logical properties, mirror swipe directions, mirror navigation back-arrow.

## Implementation gates

- `tokens.ts` is canonical. CI lint blocks any raw hex outside the table.
- New components must consume tokens via `useTokens()` hook. No inline `StyleSheet.create({ color: '#xxx' })`.
- Pastor approval required for: any verse pool change, any banned-phrase change, any Holy Code anti-pattern carve-out. Tracked in `PastorApproval` table; CI deploy gate blocks prod merge without matching row.
- Storybook for new components (CameraSheet, WhimsicalCard, StatusRing, OTPInput, UndoToast) lives in `apps/mobile/src/screens/catechism/` (existing demo path, repurposed).

## Sources

- `docs/design/mood-board.md` (north-star, anti-patterns, motion)
- `docs/design/direction-1-cathedral-light/` (chosen direction)
- `docs/design/system-v1/tokens.css` (CSS export)
- `docs/design/system-v1/screen-map.md` (canonical screen inventory, locked 2026-05-06)
- `docs/design/system-v1/{reference,components-matching,swipe-experience,swipe-flow}.html` (4 canonical preview HTMLs)
- `apps/mobile/src/lib/design-system/tokens.ts` (live runtime tokens)
- `CLAUDE.md` Holy Guardrails (code-of-conduct constraints)
- `~/.claude/plans/i-think-we-need-misty-eclipse.md` (v1-restart plan, 32-surface UX spec, eng/CEO/design review record)

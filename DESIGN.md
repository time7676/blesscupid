# DESIGN.md — BlessCupid Mobile Design System

> Canonical design system for the mobile app. Mirrors the live runtime tokens in `apps/mobile/src/lib/design-system/tokens.ts` and the prototype CSS export in `docs/design/system-v1/tokens.css`. **Tokens are the source of truth** — never hand-author hex values in screens; reach into `tokens.ts`.

## Direction

**Cathedral Light.** Dawn light through a chapel window. Warm parchment surfaces, ink for text, communion gold as the singular accent, deep cobalt as the only chromatic counterweight. No reds, no pinks, no neon.

## Color strategy

**Restrained**, with one committed move: cobalt is allowed to carry a hero CTA or selected state, but never more than ~10% of any screen. Gold is reserved for sacred moments (verse-of-day, match confirmation, brand wordmark) and never used as a UI control fill.

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
| Cobalt 700 | `color.cobalt[700]` | `#243F7A` | Headline emphasis (italic span), match badge |
| Cobalt 500 | `color.cobalt[500]` | `#3D67B8` | Active tab, links, focus ring, primary CTA |
| Cobalt 100 | `color.cobalt[100]` | `#D6E0F4` | Selected chip, soft brand surface |
| Success 500 | `color.success[500]` | `#5C8A6A` | Send-confirmed, verified pass, positive moderation |
| Warning 500 | `color.warning[500]` | `#D08A2C` | Amber for caution. **Never red.** Holy Code §HCoC |
| Hairline | `color.hairline.default` | `rgba(26,26,36,0.12)` | Default 1px divider |

**Banned.** `#FF0033` swipe-card red, neon pink, Tinder gradient orange→pink, any hex outside the table. Pure `#000` and `#fff` are also banned — every neutral is tinted toward parchment/ink.

## Typography

Two families. No third.

- **Serif identity.** Cormorant Garamond (variable). Use for: hero copy, screen titles, verse text, profile name, headline emphasis. Always pair italic span + cobalt-700 for the editorial em (e.g. *the faith.*).
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

- `Button` — variants: `primary` (cobalt-500 fill), `secondary` (parchment-raised + hairline), `ghost` (text-only with gold underline). Press = 1px translateY + slightly darker fill.
- `FormInput` — labels above, helper below, error pill underneath. Border `hairline` resting → `cobalt.500` focus → `warning.500` error.
- `RadioCard` — pill chip style for single-select (faith tradition, orientation). Selected = cobalt-100 fill + cobalt-700 border.
- `VerseCard` — sandstone-warm fill, `xl` radius, gold rule + serif italic for the verse line.
- `ScreenHeader` — eyebrow caps + serif title + optional back chevron, no center alignment.
- `BottomNav` — four tabs max. Cobalt-500 for active icon + 9px caps label. No badge dots that re-engage compulsively.
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
- Focus rings cobalt-500 at 2px outside, never removed.

## Sources

- `docs/design/mood-board.md` (north-star, anti-patterns, motion)
- `docs/design/direction-1-cathedral-light/` (chosen direction)
- `docs/design/system-v1/tokens.css` (CSS export)
- `apps/mobile/src/lib/design-system/tokens.ts` (live runtime tokens)
- `CLAUDE.md` Holy Guardrails (code-of-conduct constraints)

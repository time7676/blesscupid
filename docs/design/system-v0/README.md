# BlessCupid design system v0

> **Status:** v0 (week-4 milestone, [BLE-92](/BLE/issues/BLE-92))
> **Direction:** D1 Cathedral Light + absorbed daily-intention pattern. Selection rationale → [BLE-32](/BLE/issues/BLE-32). Pastor v0 lock applied (verb swap, no rosaries, cross-tradition typography). Photography stance per [`../mood-board.md`](../mood-board.md).
> **Audience:** [@FoundingEngineer](agent://c8eafa69-7542-40b4-a4e8-7745094aa4d8) — wire this into the Expo app and NestJS services. Not a Storybook-grade system, the smallest layer that lets onboarding ship.

## What's in this folder

```
docs/design/system-v0/
├── README.md             ← you are here
├── tokens.json           ← source of truth (style-dictionary / Tailwind compatible)
├── tokens.md             ← human reference + rationale
├── tokens.css            ← CSS variables export, mirrors tokens.json 1:1
├── components/
│   ├── button.html             ← primary / secondary / ghost · 3 states each
│   ├── radio-card.html         ← onboarding faith-question pattern
│   ├── profile-card.html       ← D2 structure ported into D1 palette + Cormorant
│   ├── daily-intention.html    ← absorbed daily-intention pattern in D1 (canonical example)
│   ├── bottom-nav.html         ← Today / People / Threads / You
│   └── form-input.html         ← input + textarea + label, all states
└── screenshots/
    ├── button.png
    ├── radio-card.png
    ├── profile-card.png
    ├── daily-intention.png
    ├── bottom-nav.png
    └── form-input.png
```

Open any HTML file in a browser at 390 × 844 to see the live component. No JavaScript dependencies; only the shared `tokens.css` plus the Google Fonts CDN for Cormorant Garamond + Inter.

## How to use the tokens

Pick the path that fits the platform.

### Web / Tailwind

`tokens.json` is shaped to load into a Tailwind config. Color tokens nest under `color.*`, type under `font.*`, etc. Engineer is free to flatten with style-dictionary or hand-author a `tailwind.config.js`. The CSS export at `tokens.css` is the v0 fallback if no build pipeline is wired yet — link it directly and use `var(--color-ink)` etc.

### React Native

The same JSON loads into a `theme.ts` constant via a tiny adapter. Color / spacing / radius are flat values; type is a small set of presets (hero / h2 / h3 / body / label / caption / eyebrow). Motion presets land as `Easing` + duration constants. Keep the names in `tokens.json` — they show up in screen readers via `accessibilityLabel` and in design reviews.

### Style-Dictionary

`tokens.json` follows the v3 token-format conventions (`{ value, type, description }`). A default style-dictionary build will produce CSS, JS, and JSON outputs without further config.

## Component guarantees

Every HTML file in `components/`:

- Renders standalone at **390 × 844** (iPhone 14 reference) with no JavaScript.
- Loads only `../tokens.css` and the Google Fonts CDN — no other dependencies.
- Uses **only** values from `tokens.json` / `tokens.css`. If you spot a literal hex in component HTML, that's a bug — file it and promote the value into the token layer.
- Mirrors copy from the existing direction mockups + Pastor v0 lock (`Not this one`, no `Pass with prayer`).

## Type system at a glance

- **Display + emotion:** Cormorant Garamond — 300 / 400 / 500 / 600 + 400 italic. Headlines, verses, CTA labels.
- **UI + body:** Inter — 400 / 500 / 600. Anything functional.
- **Fallback stack:** baked into `font.family.serif` and `font.family.sans` so engineer copy-pastes without thinking.

The full scale (hero / h2 / h3 / body-lg / body / label / caption / eyebrow) lives in `tokens.md §2.3`.

## Motion stance

Slow on purpose. Liturgical, not mechanical.

- `motion.preset.gentle` (200ms standard) — default everywhere.
- `motion.preset.intent` (320ms emphatic) — surface enter/leave.
- `motion.preset.ceremony` (560ms emphatic) — the daily-intention reveal moment. Use sparingly.

Banned: bouncy springs, confetti, any curve named "snap".

## What is intentionally **not** in v0

Be explicit so the engineer doesn't assume coverage that wasn't shipped. These are deferred — name them when you reach for them so we plan the right week:

- **Dark mode.** Single light theme only. Token names are color-neutral on purpose so a dark theme can drop in later, but no `.dark` variants ship in v0.
- **Theming.** No theme switcher, no per-tradition palette, no white-label support.
- **Internationalized typography.** Cormorant + Inter handle Latin scripts. Indonesian copy lock + script-pair review lands via Pastor week-4 — see [BLE-32](/BLE/issues/BLE-32). No CJK / Arabic / Devanagari support in v0.
- **Full icon set.** Only the placeholder glyphs used in the existing mockups (◐ ◇ ⌘ ○ ⌕ ✦ ‹ ⟡). The brand-approved iconography track lives separately ([BLE-108](/BLE/issues/BLE-108) / [BLE-127](/BLE/issues/BLE-127)) and will replace these placeholders. No SVG library bundled here.
- **Accessibility audit.** Hairlines and gold accents on parchment have not been contrast-tested for WCAG 2.1 AA. Audit lands week 5+.
- **Photography pipeline.** Profile portraits use a painterly oil-light gradient stand-in (`profile-card.html`). No AI faces, no stock placeholders. Real photos ship via the moderated photos pipeline ([BLE-70](/BLE/issues/BLE-70)).
- **Empty + error states beyond form-input.** Form-input ships a focused/error/disabled trio. Empty-list, network-error, retry, offline, etc. land with their respective screens.
- **Modal / sheet primitives.** `elevation.modal` token exists; the actual modal component does not.
- **Toast / snackbar.** No toast component, no notification center, no engagement-loop notifications.
- **Avatars beyond the icon-button circle.** No initial fallback, no group avatars, no presence dots.
- **Typography animation.** No splitting / stagger / kinetic type. The mood-board stance is stillness, not motion-as-decoration.
- **Streak / gamification components.** Per `BLE-32` lock — no streak counters, no progress rings beyond the onboarding step rail, no celebration confetti even as primitives.

## Constraints baked into the system

- **Cross-tradition humility.** No rosaries, no Reformed-only typography choices, no chapel-kitsch icons. The tradition badge in `profile-card.html` reads tradition + practice — not denomination hierarchy.
- **Imago Dei photography.** Any portrait placeholder uses the documented stance from the mood board. No AI faces in mockups, ever.
- **No engagement-loop affordances.** No streak components, no confetti, no infinite-scroll easing primitives.
- **Restrained feedback colors.** Warning is soft terracotta, not red. Success is sage, not chartreuse. Both at low chroma.

## Hand-off

When this lands and CEO approves, [@FoundingEngineer](agent://c8eafa69-7542-40b4-a4e8-7745094aa4d8) starts onboarding-flow scaffolding using these tokens + components as the wire-up reference. Reach out via the [BLE-92](/BLE/issues/BLE-92) thread for tokens questions and via the design channel for new components.

## Versioning

`v0` = "smallest thing that lets onboarding ship." Expect a `v1` once onboarding is in user testing — that pass adds dark mode, the icon set, accessibility audit, and the empty/error/loading state library.

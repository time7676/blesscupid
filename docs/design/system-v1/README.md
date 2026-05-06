# BlessCupid · system v1.1

> **Status:** v1.1 in progress. Garden Hours adopted, catechism dropped from onboarding,
> monetization + modal patterns added. Approval gate on the new screens is the next blocker.
> **Plan:** `/Users/julian/.windsurf/plans/blesscupid-screen-overhaul-4b207e.md`

## v1.1 changes (2026-04-29)

- **Garden Hours wins.** Sandstone-warm + gold-soft + amber-ink (warning-700) is the chord.
- **Welcome hero animated** with a 14-second CSS keyframe drift; RN port uses `react-native-reanimated`.
- **Cobalt retired** from user-facing surfaces. Italic emphasis, active states, selected chips, and selected radios all use the amber ramp now.
- **All primary buttons are ink-black.** No blue, no amber buttons.
- **Catechism is out of the onboarding loop.** Beat 1–8 ceremony dropped per user direction. Verse-of-day card on Today carries the spiritual thread; catechism content stays in i18n for a future "reading room" feature.
- **Monetization (gentle).** Today now has a "Profile views" gated card. You has a plan-tier row.
- **New section C: Modals & overlays** (notification toast, one-time offer, gated feature, Q3 redirect).
- **App loop reaffirmed.** Tinder/Bumble simplicity + heavy moderation + Christian-specific moments.

## What lives here

```
system-v1/
├── README.md                    ← you are here
├── tokens.css                   ← v1 token export, mirrors lib/design-system/tokens.ts
├── prototypes/
│   └── index.html              ← single-file design-review surface (open in any browser)
├── motion/                      ← (later) HTML→MP4/GIF animation prototypes
└── CHANGELOG.md                 ← (later) deltas vs v0 for Pastor sign-off
```

## How to review

1. Open `prototypes/index.html` in any browser. No server, no build.
2. Read the assumptions panel at the top — flag anything wrong.
3. Walk the **A-block** (3 Welcome direction variants). Pick A / B / C.
4. Walk the **B-block** (8 anchor screens). Mark each row 👍 / ✏️ / ❌ in the §C table at the bottom.
5. Hand back; only 👍 rows get RN implementation in the next phase.

## v1 deltas vs v0

| Area | v0 | v1 | Why |
|---|---|---|---|
| Brand accent | `--color-indigo` (single token) | `--color-cobalt-50…900` (full ramp) | v0 had no usable brand-accent scale. Cobalt-700 replaces indigo as `headlineEm`; cobalt-500 = active tab; cobalt-50 = quiet brand-tint surface. |
| Feedback | `--color-warning` + `--color-success` (single tokens) | Ramps `100/500/700` for both | Skeleton chips, buttons, and dim-mode banners all need different stops. Warning stays amber (Holy Code §HCoC bans red); success stays sage. |
| Radius | `lg=12, pill=999` | + `xl=20, xxl=28` | Catechism Beat hero cards need the larger radii. |
| Space | `s0…s10` | + `s11=56` | Same. |
| Display face | Cormorant Garamond | unchanged | BLE-32 Pastor lock retained. |

## What's intentionally **not** in v1 yet

- Storybook RN entry (still throws in `App.tsx`).
- The full set of empty/error/loading components in source. Phase 0 prototypes show the visual pattern; RN primitives ship in phase 2 of the plan.
- Real assets — every illustration, BottomNav icon, portrait, glyph is a CSS-gradient or Unicode placeholder. See plan §12 for the asset spec hand-off.

## Asset hand-off

The current exhaustive brand asset spec lives in `docs/design/system-v1/brand-assets.md`.

Assets are generated into `apps/mobile/assets/brand/` by `apps/mobile/scripts/generate_brand_assets.py`. The app consumes the PNG exports through `apps/mobile/src/lib/brand/assets.ts`; SVG files are source masters for review and future vector adoption.

Catechism Beat 2-8 hero art is dropped from v1.1 because catechism left onboarding. The current pack covers logo, app icon, splash, hero art, empty and error states, BottomNav, UI glyphs, tradition badges, practice badges, portrait placeholders, texture, verse art, and marketing exports.

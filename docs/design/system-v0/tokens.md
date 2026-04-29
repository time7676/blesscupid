# BlessCupid design system v0 — tokens

> Source of truth: [`tokens.json`](./tokens.json). CSS export: [`tokens.css`](./tokens.css).
> If you find a hex in a component HTML, that's a bug — promote it into `tokens.json` first.

This is the v0 token layer for **D1 Cathedral Light + absorbed daily-intention pattern** (selection rationale: [BLE-32](/BLE/issues/BLE-32)). It carries every value used by the existing D1 mockup ([`docs/design/direction-1-cathedral-light/index.html`](../direction-1-cathedral-light/index.html)) and the daily-intention home from [BLE-91](/BLE/issues/BLE-91), plus the off-white/charcoal neutrals from D3 that translate cleanly without breaking the warm cathedral feel.

## 1 · Color

The palette is locked and intentionally narrow. Two surface families, one accent, one liturgical emphasis, two feedback colors. **Gold is not a CTA color.** The CTA is ink on parchment.

### 1.1 Ink (text + dark surface)

| Token | Hex | Use |
|---|---|---|
| `color.ink` | `#1A1A24` | Primary text, dark CTA fill, tabbar active glyph, home indicator. |
| `color.ink.soft` | `#3F3F4A` | Helper copy, secondary labels, meta. |
| `color.ink.charcoal` | `#14181F` | Cooler near-black absorbed from D3 neutrals. Reserve for monochrome surfaces where parchment is wrong (modal scrim, video controls, dev surfaces). |

### 1.2 Parchment (default surface)

| Token | Hex | Use |
|---|---|---|
| `color.parchment` | `#FAF7F0` | Page background. The cathedral light field. |
| `color.parchment.raised` | `#FFFDF7` | Card surface above parchment. Lifted by hairline, not shadow. |
| `color.parchment.off` | `#F8F8F4` | Cooler off-white from absorbed D3. Use for neutral surfaces that should not read warm — data displays, settings, system messages. |

### 1.3 Sandstone (selectable surface)

| Token | Hex | Use |
|---|---|---|
| `color.sandstone` | `#F4ECDF` | Radio-card resting state, secondary tile. |
| `color.sandstone.deep` | `#EFE4D2` | Pressed / hover state for sandstone. |
| `color.sandstone.warm` | `#FBF3E2` | Selected radio-card fill. Reads as "the gold landed on the parchment." |

### 1.4 Gold (communion accent)

| Token | Hex | Use |
|---|---|---|
| `color.gold` | `#C8A24B` | Selection ring, ornament rule, pip, badge accent. **Never a CTA fill.** |
| `color.gold.soft` | `#E5C97D` | Tint highlight on backgrounds only. Never on text. |
| `color.gold.halo` | `rgba(200, 162, 75, 0.18)` | Pip halo, focus ring around interactive markers. |

### 1.5 Indigo (liturgical emphasis)

| Token | Hex | Use |
|---|---|---|
| `color.indigo` | `#2A3470` | The italic emphasis word inside a serif headline. Liturgical. Never on body text, never on a button fill. |

### 1.6 Hairline (dividers + borders)

| Token | Value | Use |
|---|---|---|
| `color.hairline` | `rgba(26, 26, 36, 0.12)` | Default border + 1px divider. |
| `color.hairline.soft` | `rgba(26, 26, 36, 0.06)` | Whisper divider inside a card. |
| `color.hairline.strong` | `rgba(20, 24, 31, 0.16)` | Stronger divider, used sparingly (table header). |

### 1.7 Feedback

Restrained on purpose. We are not a system-status app.

| Token | Hex | Use |
|---|---|---|
| `color.feedback.warning` | `#A95837` | Soft terracotta. Cross-tradition non-red alert. Use at low chroma; prefer this over hard red. |
| `color.feedback.success` | `#5C7A56` | Sage green. Completion confirmation only. |

## 2 · Type

**Cormorant Garamond** for display + emotional copy. **Inter** for everything functional. One serif, one sans, no third family.

Fallback stacks are baked into the font tokens so engineers can copy-paste without thinking about it.

### 2.1 Families

| Token | Stack |
|---|---|
| `font.family.serif` | `'Cormorant Garamond', 'EB Garamond', Georgia, serif` |
| `font.family.sans` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |
| `font.family.mono` | `ui-monospace, SFMono-Regular, Menlo, monospace` (dev only — not customer-facing) |

### 2.2 Weights

`300 light` · `400 regular` · `500 medium` · `600 semibold`

We do not ship 700/900. Cormorant at 600 is heavy enough; pushing harder reads tabloid.

### 2.3 Scale

| Token | Size | Line height | Tracking | Family / weight | Use |
|---|---|---|---|---|---|
| `hero` | 38px | 1.04 | -0.012em | serif · regular | Onboarding question, greeting, screen H1. |
| `h2` | 26px | 1.18 | -0.012em | serif · regular | Card headline, profile name. |
| `h3` | 22px | 1.35 | normal | serif · 400 italic | Verse text, prompt answer. |
| `body-lg` | 16px | 1.55 | normal | sans · regular | Form-input value, paragraph emphasis. |
| `body` | 14px | 1.55 | normal | sans · regular | Default body, helper, intention body. |
| `label` | 13px | normal | 0.02em | sans · medium | Form labels, secondary action labels, skip links. |
| `caption` | 12.5px | normal | normal | sans · regular | Sub-copy under list items, meta. |
| `eyebrow` | 11px | normal | 0.2em | sans · semibold uppercase | Section labels (`STEP 4 OF 10`, `TODAY`, `DAILY INTENTION`). |

CTA button labels override the rule: **17px serif medium, tracking 0.02em**, because the CTA is doing emotional work in this product, not just functional confirmation.

### 2.4 Italics

Italic Cormorant + indigo is reserved for **the emphasized word** inside a serif headline (`What does prayer look like in *your* week?`). It is not a body-text style. Don't italicize whole sentences.

## 3 · Space

4px base scale. Most components live on multiples of 8.

| Token | px | Common use |
|---|---|---|
| `space.1` | 4 | Inline icon gap |
| `space.2` | 8 | Tight stack |
| `space.3` | 12 | Inline group, control padding y |
| `space.4` | 16 | Default stack |
| `space.5` | 20 | Card padding y |
| `space.6` | 24 | Screen gutter |
| `space.7` | 32 | Section gutter |
| `space.8` | 40 | Major section break |
| `space.9` | 56 | Hero margin |
| `space.10` | 72 | Generous breathing room |

## 4 · Radius

The CTA button is **square** (`radius.xs = 2px`). That's intentional — Cathedral Light prefers structural geometry over softness on the primary commit. Soft radii (`md`, `lg`) are for cards and inputs. Pills (`radius.pill`) are for badges, never primary controls.

| Token | px | Use |
|---|---|---|
| `radius.none` | 0 | Edges, dividers. |
| `radius.xs` | 2 | CTA button. |
| `radius.sm` | 4 | Radio card, reveal banner. |
| `radius.md` | 6 | Intention card. |
| `radius.lg` | 12 | Form input. |
| `radius.pill` | 999 | Tradition badges, pip rails. |
| `radius.circle` | 50% | Avatars, icon buttons, radio markers. |

## 5 · Border

| Token | Width | Use |
|---|---|---|
| `border.thin` | 1px | Default border. |
| `border.medium` | 1.5px | Radio marker stroke. |
| `border.thick` | 2px | Progress rail, focus outline (deferred). |

## 6 · Elevation

D1 Cathedral Light prefers hairlines over shadow. Most surfaces are flat. Two shadows ship in v0:

| Token | Value | Use |
|---|---|---|
| `elevation.0` | none | Default. |
| `elevation.raise` | `0 1px 0 rgba(26, 26, 36, 0.04)` | Subtle lift for cards above parchment. |
| `elevation.modal` | `0 12px 32px rgba(20, 24, 31, 0.18)` | Modal / sheet only. |

If you reach for a third shadow value, stop and add it to `tokens.json` with a documented reason.

## 7 · Motion

Slow on purpose. We don't bounce, ping, or shimmer. The mood-board stance: motion is liturgical, not mechanical.

### 7.1 Durations

| Token | ms | Use |
|---|---|---|
| `motion.duration.instant` | 80 | Color/opacity flick (icon press). |
| `motion.duration.gentle` | 200 | **Default UI transition.** Borders, fills, simple state. |
| `motion.duration.intent` | 320 | Surface enter/leave, card reveal. |
| `motion.duration.ceremony` | 560 | The reveal-the-day moment. The "take a breath" pause. Use sparingly. |

### 7.2 Easing

| Token | Curve | Use |
|---|---|---|
| `motion.easing.standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default. Material-standard. |
| `motion.easing.emphatic` | `cubic-bezier(0.2, 0.7, 0.2, 1)` | Soft overshoot. Pairs with intent + ceremony. |
| `motion.easing.linear` | `linear` | Progress fills only. |

### 7.3 Presets (use these in components)

| Token | Value | Use |
|---|---|---|
| `motion.preset.gentle` | `200ms cubic-bezier(0.4, 0, 0.2, 1)` | Default everywhere. |
| `motion.preset.intent` | `320ms cubic-bezier(0.2, 0.7, 0.2, 1)` | Card enter, drawer slide, daily-intention reveal. |
| `motion.preset.ceremony` | `560ms cubic-bezier(0.2, 0.7, 0.2, 1)` | The reveal moment. **Never on routine UI.** |

### 7.4 What's banned

- Spring physics with bounce > 0. We don't bounce.
- Confetti, parallax, infinite-scroll easing curves.
- Any motion with the word "snap" in the brief.

## 8 · Device reference

V0 mockups render at **390 × 844** (iPhone 14 reference). Home-indicator is `134 × 5`. Engineer is free to make the eventual app responsive — these are reference values for the static mockups only.

## 9 · Cross-tradition humility

Tokens encode a posture, not just values. A few hard rules baked in:

- **Gold is not a CTA color.** It's communion / accent / ornament. The committing action is ink on parchment.
- **Indigo italics are for one emphasized word**, never a whole sentence.
- **No engagement-loop colors.** No streak orange, no urgent red, no celebratory pink. The warning token is restrained terracotta on purpose.
- **Photography stance** is documented in [`../mood-board.md`](../mood-board.md). No AI faces in any v0 placeholder.

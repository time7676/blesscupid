# BlessCupid · Logo B — Mark System v1.0

Direction B (Wordmark + halo) finalized per CEO sign-off on [BLE-22](/BLE/issues/BLE-22).
Source ticket: [BLE-86](/BLE/issues/BLE-86).
Token foundation: [BLE-22 · tokens v0.1](/BLE/issues/BLE-22#document-tokens).

## What's here

| File | Purpose |
|---|---|
| `brand-sheet.html` | **Primary deliverable.** Single-file reference doc. All variants, anatomy, clear-space, do/don't, token reference, drop-in component. Open in browser. |
| `svg/wordmark-primary.svg` | Cobalt-900 on cream. Default. |
| `svg/wordmark-cream-on-cobalt.svg` | Cream on cobalt-600 ground (splash, marketing). |
| `svg/wordmark-mono-cobalt.svg` | Single-color cobalt-900 (with gold halo retained on cream/cobalt-50 grounds). |
| `svg/wordmark-mono-flat-black.svg` | Pure mono black, halo + rule both black. Print/fax. |
| `svg/wordmark-mono-flat-white.svg` | Pure mono white, halo + rule both white. Foil/dark photo. |
| `svg/monogram-primary.svg` | BC monogram, cobalt-900 on cream. |
| `svg/monogram-cream-on-cobalt.svg` | BC, cream on cobalt-600. iOS app-icon variant. |
| `svg/monogram-mono-black.svg` | BC mono black. |
| `svg/monogram-mono-white.svg` | BC mono white. |
| `svg/app-icon-1024-cobalt.svg` | **iOS master, primary.** 1024×1024, cobalt ground. |
| `svg/app-icon-1024-cream.svg` | iOS alt (marketing only — not home screen). |
| `svg/app-icon-android-foreground.svg` | Android Adaptive foreground (108×108dp, 72dp safe zone). |
| `svg/app-icon-android-background.svg` | Android Adaptive background (cobalt-600 solid). |
| `svg/favicon.svg` | Vector favicon, scales 16..512. Cobalt ground, cream BC, gold halo. |
| `svg/favicon-16-fallback.svg` | 16×16 fallback. Halo dropped (collapses to noise at this size — per acceptance test). |
| `svg/og-card.svg` | 1200×630 OpenGraph + Twitter card. **Tagline gated on Pastor copy review.** |

## Engineer drop-in checklist (FoundingEngineer)

### 1. Favicons + Apple touch + manifest

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
```

`favicon-16.png` rasterized from `svg/favicon-16-fallback.svg`. All other sizes from `svg/favicon.svg`.

### 2. iOS app icon export

Source: `svg/app-icon-1024-cobalt.svg`. Export PNG24 at 1024×1024, no transparency, no rounded corners (Apple applies). Standard iOS derivatives (60, 76, 83.5, 120, 152, 167, 180, 1024 — see Apple HIG). Use `xcrun actool` or your existing pipeline.

### 3. Android adaptive

`mipmap-anydpi-v26/ic_launcher.xml`:
```xml
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@drawable/ic_launcher_background"/>
  <foreground android:drawable="@drawable/ic_launcher_foreground"/>
  <monochrome android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
```
`ic_launcher_background` ← `svg/app-icon-android-background.svg` (rasterize per density).
`ic_launcher_foreground` ← `svg/app-icon-android-foreground.svg`.

### 4. OG card

Rasterize `svg/og-card.svg` to PNG via Puppeteer or `sharp + resvg-js` in build step. Webfonts must be loaded into the renderer. Serve as `og:image`, `twitter:image`. **Do NOT serve SVG directly** — most scrapers don't render SVG webfonts.

### 5. Wordmark drop-in (React/HTML)

Section 10 of `brand-sheet.html` has a self-contained `<BlessCupidLogo />` component using only existing Token v0.1 CSS variables. No new deps.

## Pastor review (BLE-87)

These items must pass Pastor before going live in marketing:

- [ ] Halo signal in Logo B (gold dot, not iconographic) — confirm doctrinal acceptability across Catholic + Protestant traditions
- [ ] OG card tagline placeholder (`Faith first · Friendship · Courtship · Community`) — Pastor copy review
- [ ] Sanctified-ground rule terminology (internal only — won't ship in copy)

## Verification

Brand sheet rendered in Chromium at desktop viewport (998×886). All 10 sections screenshotted in `screenshots/`. App icon, favicon (all sizes), wordmark variants, monogram variants, do/don'ts, token reference all render correctly with Source Serif 4 (Google Fonts) and tokens from BLE-22.

## Locked decisions (do not retune without designer sign-off)

- Source Serif 4, weight 500, optical-sizing 60.
- Wordmark letter-spacing: +1px.
- Monogram letter-spacing: -0.04em.
- Halo dot radius: ~6.5% canvas on monograms (so it survives 60×60 Spotlight).
- Gold halo color: `gold-500 #C99A3A` on cream, `gold-300 #E9C780` on cobalt (better contrast).
- 16×16 favicon: BC only, no halo (per acceptance test).
- iOS primary: cobalt ground (cream blends with iOS default light wallpaper).

## Constraints carried from BLE-22

Wordmark + halo only. No cross/anchor reintegration. Mode-neutral (Dating + Friendship + Commonsphere). Reverent, not religious-kitsch. Indonesian-market scaling.

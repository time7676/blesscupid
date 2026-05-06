# BlessCupid Brand Asset Spec

> Status: v1.1 Garden Hours. Canonical asset handoff for app, store, and marketing surfaces.

## Source of Truth

- Runtime tokens: `apps/mobile/src/lib/design-system/tokens.ts`
- CSS mirror: `docs/design/system-v1/tokens.css`
- Asset generator: `apps/mobile/scripts/generate_brand_assets.py`
- Runtime imports: `apps/mobile/src/lib/brand/assets.ts`
- Output folder: `apps/mobile/assets/brand/`

Rule: change tokens first, mirror CSS second, regenerate assets third. Screens import assets and design-system tokens only. No screen-level hex.

## Brand Direction

Garden Hours is the production form of Cathedral Light: warm parchment, sandstone-warm, ink, communion gold, amber-ink, and soft sage. Primary controls are ink-black. Amber carries selected and warning states. Gold belongs to sacred emphasis: wordmark rule, verse cards, match ceremony, and Bless+ accent. Cobalt is reserved for legacy prototypes and future secondary states, not v1.1 app chrome.

## Asset Inventory

| Category | Files | Size / format | Runtime use | Direction |
|---|---:|---|---|---|
| Logo | 5 PNG + 5 SVG | 1400x360 wordmarks, 512x512 marks | Welcome, splash, Bless+ sheets | Serif wordmark, quiet monogram, gold rule/halo only |
| App icon | 4 PNG + SVG masters | 1024 iOS, 432 adaptive layers, 96 notification | Store and native shell | Parchment ground, BC mark, no cross or heart |
| Splash | 1 PNG + SVG master | 2732 square | Launch screen | Centered mark + wordmark, warm light |
| BottomNav | 8 PNG + 8 SVG | 96 PNG, 24 SVG | Today, People, Threads, You | Single-stroke 1.5-1.6px, active ink fill |
| UI glyphs | 22 PNG + SVG masters | 96 PNG | Settings, safety, sheets, profile controls | Neutral line icons, no emoji fill |
| Heroes | 4 PNG + SVG masters | 1500x1800 or 1500x600 | Welcome, Done, Q3 redirect, one-time offer | Painterly light fields, abstract only |
| Empty states | 6 PNG + SVG masters | 480 square | Today, People, Threads, search, offline, under construction | Helpful, non-cute, no mascots |
| Error states | 5 PNG + SVG masters | 360 square | Network, server, auth, face detect, moderation | Amber caution, never red |
| Portrait placeholders | 6 PNG + SVG masters | 750x1000 | Mock profiles before real user photos | Abstract silhouettes only, no AI faces |
| Tradition badges | 8 PNG + SVG masters | 64 square | Faith-tradition chips/profile metadata | Self-identification only, not decorative chrome |
| Practice badges | 7 PNG + SVG masters | 64 square | Practice tags and faith details | Gentle line symbols, cross-tradition safe |
| Verse art | 3 PNG + SVG masters | 1080x1350 | Verse-of-day card backgrounds | Morning, midday, evening light variants |
| Textures | 2 assets | 1500 grain PNG, 200x4 rule SVG | Background grain, gold rule | Subtle paper and sacred divider |
| Marketing | 8 PNG + SVG masters | favicon set, 600x200, 1200x630, 2880x1620 | Web, email, social previews | Wordmark-first, no fake couples |

## Required App Assets

### Logo

- `logo/wordmark-primary.png`
- `logo/wordmark-inverse.png`
- `logo/logo-mark.png`
- `logo/logo-mark-inverse.png`
- `logo/bless-plus-wordmark.png`

Use wordmark above 120 px rendered width. Use mark below 120 px or square placements. Do not combine wordmark and mark in the same lockup unless the surface is splash or app icon.

### Navigation

- `nav/tab-today-active.png`, `nav/tab-today-inactive.png`
- `nav/tab-people-active.png`, `nav/tab-people-inactive.png`
- `nav/tab-threads-active.png`, `nav/tab-threads-inactive.png`
- `nav/tab-you-active.png`, `nav/tab-you-inactive.png`

Active state uses ink fill. Inactive state uses line only. Do not add badges, dots, unread counters, or pulsing states.

### Heroes

- `heroes/welcome-hero.png`
- `heroes/done-hero.png`
- `heroes/dating-out-of-scope-hero.png`
- `heroes/one-time-offer-band.png`

Hero art remains abstract. No AI faces, no couple stock images, no stained-glass literalism.

### State Art

Empty states:

- `empty/today-empty.png`
- `empty/people-empty.png`
- `empty/threads-empty.png`
- `empty/search-empty.png`
- `empty/offline.png`
- `empty/under-construction.png`

Error states:

- `error/error-network.png`
- `error/error-server.png`
- `error/error-unauthorized.png`
- `error/error-face-detect.png`
- `error/error-moderation.png`

State art supports copy; it never replaces clear copy or action affordances.

### Faith Identity Badges

Tradition:

- `tradition/catholic.png`
- `tradition/protestant-evangelical.png`
- `tradition/protestant-pentecostal.png`
- `tradition/protestant-reformed.png`
- `tradition/protestant-mainline.png`
- `tradition/orthodox.png`
- `tradition/other-christian.png`
- `tradition/still-figuring.png`

Practice:

- `practice/sunday-in-person.png`
- `practice/sunday-online.png`
- `practice/catholic-mass.png`
- `practice/daily-prayer.png`
- `practice/small-group.png`
- `practice/worship-at-home.png`
- `practice/still-finding-a-community.png`

Badges identify user-selected data. They are not nav icons, decorative dividers, or doctrinal ranking cues.

## Store and Marketing

- iOS icon: `app-icon/app-icon-ios-1024.png`
- Android adaptive foreground: `app-icon/android-adaptive-foreground.png`
- Android adaptive background: `app-icon/android-adaptive-background.png`
- Android notification icon: `app-icon/notification-icon-android.png`
- Email header: `marketing/email-header-600x200.png`
- OG card: `marketing/og-card-1200x630.png`
- Landing hero: `marketing/landing-hero-2880x1620.png`
- Favicons: `marketing/favicon-16.png`, `favicon-32.png`, `favicon-180.png`, `favicon-192.png`, `favicon-512.png`

Marketing imagery must stay scene-based or abstract until commissioned real photography exists. No generated people.

## Bans

- Red, pink, Tinder orange-pink gradients.
- Hearts as primary action symbols.
- Crosses, doves, rosaries, or church-denomination symbols in nav.
- AI-generated faces or fake couple photos.
- Confetti, hearts-fly, badge dots, streaks, "online now" or "viewed you" visual nudges.
- Gold-filled controls.
- Cobalt primary buttons or cobalt active tabs in v1.1.

## Regeneration

Run from repo root:

```bash
python3 apps/mobile/scripts/generate_brand_assets.py
```

Then verify:

```bash
python3 -m json.tool apps/mobile/assets/brand/manifest.json >/dev/null
pnpm -F @blesscupid/mobile typecheck
```

If the generator changes image dimensions, update this spec and `apps/mobile/src/lib/brand/assets.ts` in the same change.

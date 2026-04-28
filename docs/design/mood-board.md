# BlessCupid — Brand mood board (v0)

- Status: Draft for CEO review
- Issue: [BLE-32](/BLE/issues/BLE-32)
- Author: Founding Designer
- Date: 2026-04-28

## Purpose

Establish the visual and tonal canon BlessCupid will be designed against. Not a final brand. A reference for the three visual directions (`direction-1`, `-2`, `-3`) and a baseline for the design system v0 in week 4.

## North-star feeling

> "Dawn light through a chapel window — quiet, intentional, hopeful. Not a nightclub. Not a hymnal."

Three constraints govern every visual choice:

1. **Sacred, not religious-kitsch.** Reverence comes from restraint, light, space, and typography — not stained-glass stock photos and crosses on every screen.
2. **Warm, not flirty.** Morning light, not nightclub neon. No saturated reds, no hot pinks, no swipe-card lust signals.
3. **Cross-tradition humility.** Works for both Catholic and Protestant readers. No tradition-locked iconography (no rosaries on splash, no Reformed-only blackletter).

If a visual cue would feel at home on Tinder, Hinge, or Bumble, default to changing it.

## Typography references

The dating-app default is geometric sans (Bumble's Avenir, Hinge's Söhne-adjacent). To break that default, BlessCupid leans into **literary serif as identity** — humanist, high-contrast, with breathing room — paired with neutral grotesque for body where mobile legibility demands it.

| Reference | Why |
|---|---|
| Cormorant Garamond / EB Garamond / Cardo | Liturgical-adjacent without being literally religious. Long-form intent. |
| GT Sectra / Reckless / Tiempos Headline | Contemporary humanist serifs with editorial weight; sacred-modern tone. |
| Söhne / Inter / GT Walsheim | Neutral grotesques for body and UI. iOS-friendly at small sizes. |
| Newsreader (Google Fonts) | Variable serif, free, ships well — strong fallback for direction work. |

**Avoid:** Blackletter (tradition-coded), Trajan (Hollywood-religious cliché), italic script display ("Wedding-invitation Cupid").

## Color exploration

The palette anchors are warm neutrals + a single accent that does *not* read as romantic-red. Three families to test across the three directions:

| Family | Anchor | Accent | Vibe |
|---|---|---|---|
| Communion / Cathedral | sandstone `#F4ECDF`, ink `#1A1A24` | communion gold `#C8A24B`, deep indigo `#2A3470` | Reverent, monastic, restrained |
| Garden / Tea-after-church | cream `#FBF6EC`, deep brown `#3B2A21` | terracotta `#C36F4A`, sage `#6E7E5C` | Warm, embodied, hand-crafted |
| Quiet Modern / Scandinavian-sacred | chapel white `#F8F8F4`, charcoal `#14181F` | slate blue `#4F6273`, muted ochre `#B89668` | Calm, contemporary, spare |

**Banned for v0:** swipe-card red `#FF0033`, neon pink `#FF3399`, Tinder gradient orange→pink. Any color that triggers "match-now" urgency.

## Photography style

The hardest constraint to hold. Christian dating apps default to either (a) stock-perfect couples on a beach or (b) AI-generated faces. Both fail. Direction:

- **Real, dignified portraits.** Modest framing — shoulder-up or three-quarter, no body-only or swimwear. Soft natural light, indoor or golden-hour outdoor.
- **Pre-launch:** licensed Unsplash / Pexels portraits with attribution; commission a small original shoot before public launch.
- **Hard rule:** no AI-generated faces anywhere in the product or marketing — including mockup placeholders. Mockups use abstract placeholders (gradient + initial) rather than fake people.
- **Scenes over couples.** Hands holding a coffee. A pew at golden hour. An open journal. People doing intentional things, not posing.
- **Diversity is non-negotiable.** Cross-tradition means cross-cultural — Catholic Latin America, Protestant West Africa, Orthodox Eastern Europe, Asian Christian diaspora. Default casting must reflect this.

## Iconography stance

- **Custom line set, single-stroke 1.5px.** No filled emoji-style icons.
- **No literal religious iconography in nav or core actions.** No crosses on the home tab. No doves on the chat tab. Sacredness lives in typography and pacing, not iconography.
- A small, optional "tradition badge" on profiles (cross / fish / dove) is permitted as user-self-identification — never decorative chrome.

## Motion principles

- **Calm, not snappy.** Default ease: 380ms cubic-bezier(0.25, 0.1, 0.25, 1). Slower than Material default. Doherty Threshold (<400ms) honored, but motion communicates pause and intention rather than urgency.
- **No spring-bounce.** No iOS-style overshoot on profile cards. Bounce reads as flirty.
- **No infinite-loop animations.** No pulsing hearts, no breathing icons. Anything that loops triggers compulsive attention.
- **Page transitions:** soft fade + 8px upward translate. Modal: fade-in only, no scale.
- **Reduced motion:** instant fade swap, no translate.

## Anti-patterns (refuse)

- Swipe-card stack as the primary discovery mechanic. (Daily-batch model preferred — see ADR for matching.)
- Heart icons as the primary affordance. ("Reach out" / "Send a blessing" / "Begin a conversation" — words over symbols.)
- Streak counters, daily-login rewards, "X people viewed your profile" anxiety nudges, "Y messages waiting!" notification bait.
- Confirmshaming on settings ("No thanks, I'd rather stay alone").
- Confetti / hearts-fly animation on match. Replace with a quiet, single-tone confirmation and a Scripture or quote chosen by Pastor.

## Source attributions (placeholder set for week 2)

This is a v0 mood board. Reference imagery for direction work — to be replaced before any public-facing pixel ships.

- Typography specimens: type foundry sites (Klim, Grilli Type, Adobe Fonts, Google Fonts). Used for shape reference only — not embedded in product.
- Color references: ChurchInteriorAtGoldenHour visual canon (general, no single source); morning-light interior photography canon.
- Photography mood references: TIME LightBox, National Geographic editorial portraits, Magnum Photos religious-life series — used for *framing and tone* reference only. Not licensed for product use.
- All photography in the product (v1.0+) must be (a) commissioned, (b) Unsplash/Pexels with explicit license + attribution, or (c) user-uploaded with moderation pipeline applied.

## Open questions for Pastor (week 4 input)

- UX-copy tone: "send a blessing" vs "reach out" vs "begin a conversation" — Pastor selects voice register.
- Is a daily Scripture / quote on first launch in scope, or scope-creep?
- Match-event copy ("you've been matched"): does Pastor want a covenantal framing, or a deliberately quiet one?
- Conversation prompts: Pastor authors v0 list of 30 prompts spanning faith depth, hopes, family, vocation.

These are queued — week 2 mockups use placeholder copy where Pastor input is needed.

## Lens citations

- **Aesthetic-Usability Effect** — sacred-feeling type and pacing raise perceived trust before any feature ships.
- **Norman 3 levels** — visceral (calm palette), behavioral (slow motion, deliberate flows), reflective (mission alignment over engagement metrics).
- **Kano Model** — moderation/safety = must-have; daily Scripture/intention = potential delighter; swipe-stack = anti-feature.
- **Hick's Law / Choice Overload** — daily batch (3–5 candidates) over endless swipe stack.
- **Peak-End Rule** — match moment and conversation start carry weight; design them as quiet rituals, not slot-machine wins.
- **Ethics (faith-first)** — refuse dark patterns. Refuse engagement metrics that conflict with user wellbeing or holiness.

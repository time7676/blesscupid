# PRODUCT.md — BlessCupid

> Canon source for impeccable design context. Distilled from `docs/design/mood-board.md`, `CLAUDE.md` Holy Guardrails, and `docs/copy/` voice notes. Update here when product positioning shifts.

## Register

`product` — design SERVES the product. Mobile app UI for sustained use, not a marketing surface.

## One-line

A faith-first dating app for committed Christians who want a slow, dignified path from match to covenant — not the swipe casino.

## Users

- **Primary.** Single Christians 25–38, Catholic + Protestant, English-speaking (PH, US, UK, Indonesia diaspora at launch). Disillusioned with Tinder/Bumble/Hinge. Going to church. Want marriage on the horizon, not a hookup.
- **Edge personas to honor.** Divorced / widowed / single-parent / church-hurt / late-converted Christians. Default copy must not exclude them.
- **Out of scope.** Casual daters, "open to anything" users, sexual-content seekers. App actively repels these via tone, friction, and moderation.

## Product purpose

Replace nightclub-energy dating UX with morning-light covenant UX. Three things people should be able to do well:

1. **Receive a small daily batch** of faith-aligned introductions, not an infinite swipe stack.
2. **Begin a real conversation** anchored on a shared verse, prompt, or intention — not a "hi" message.
3. **Move toward an in-person meeting** with explicit pacing and accountability cues.

Everything else (profile, settings, safety) supports those three.

## Tone

- **Sacred, not religious-kitsch.** Reverence from restraint, light, space, typography. No stained-glass stock photos. No crosses on every screen.
- **Warm, not flirty.** Morning light, never neon. No saturated reds, no hot pinks, no swipe-card lust signals.
- **Cross-tradition humility.** Works for Catholic + Protestant readers without favoring either. No tradition-locked iconography (no rosaries on splash, no Reformed-only blackletter).
- **Slow over snappy.** Motion communicates pause and intention, never urgency. No streaks, no daily-login rewards, no "Y messages waiting" anxiety bait.
- **Words over symbols.** "Begin a conversation" / "Reach out" / "Send a blessing" — not heart icons as the primary affordance.

## Anti-references

If a visual or interaction cue feels at home on these, refuse and rewrite:

- **Tinder / Bumble / Hinge** — swipe-card stack, heart taps, neon gradients, streaks, "X people viewed your profile."
- **Christian Mingle (legacy)** — stock-photo couples on a beach, cursive scripts, cross-gradient logos, AI-generated faces.
- **OkCupid match-percent gamification** — quizzes that score humans.
- **Any "match-now" urgency design** — countdown timers, "act fast" CTAs, confetti on match, hearts-fly animation.

## Strategic principles

1. **Daily batch, not infinite feed.** Three profiles a day. Scarcity = attention. The home tab earns the name "Today" because it has a beginning and an end.
2. **One person at a time.** Profile-as-page beats profile-as-card-in-a-deck. The user reads, considers, decides. Swipe is allowed as navigation; never as judgment shorthand.
3. **Verse-of-day as anchor.** Every conversation begins with a shared text or pastor-curated prompt. Removes the "what do I say" cold-start.
4. **Accountability over privacy theater.** Visible report + one-tap block on every thread. Photos require face-detection pass. Body-only photos rejected by default.
5. **Pacing is a feature.** Built-in friction at known abuse points: signup age gate, profile bio Pastor moderation, escalation to in-person meet.

## Holy Code (non-negotiable, from CLAUDE.md)

- No sexual content, no nude imagery, no hookup framing in copy or UX.
- Every chat thread has a visible report button + one-tap block.
- Profile photos require face-detection pass; body-only photos rejected by default.
- Age gate 18+ on signup.
- Text moderation via OpenAI; image moderation via AWS Rekognition.
- Any UX copy touching faith, relationships, or moderation requires Pastor sign-off before ship.

## Surfaces in scope (mobile app)

| Surface | Purpose | Frequency |
|---|---|---|
| Auth (Welcome / Sign in / Sign up) | First-touch + return entry | One-time per user, then rare |
| Onboarding (AgeGate → Covenant → Faith → ProfileBasics → FirstPhoto → Bio) | Self-disclosure + alignment | One-time, ~5–8 min |
| Today | Daily batch of 3 introductions + verse-of-day | Daily |
| People | Mutual connections + in-flight conversations | Multiple times daily once active |
| Profile detail | One person, full read | On-demand from Today / People |
| Thread | Conversation between two people, verse-anchored | Multiple times daily once active |
| You | Profile + settings + safety + sign out | Weekly |

## Out of scope at launch (Apr 2026)

Voice/video calls, group features, events, livestream, in-app purchases, subscription tiers, ML matching beyond rules-based filters.

## Success signal

A user opens the app at 7:30am over coffee, reads three profiles, chooses to begin one conversation grounded in today's verse, closes the app. Returns at 8pm, reads the reply, sends one. Closes the app. The phone is not a slot machine that day.

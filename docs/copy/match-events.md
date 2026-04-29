# Match-event copy — Pastor canon (engine UX strings)

Owner: Pastor (acd89680-4a61-4f55-b0ee-387f7983b3f6)
Source asks: BLE-95 §5 (match-event copy), BLE-8 CEO sign-off (engine UX strings —
daily-stack header, mutual-match modal, chat-locked state).
Sign-off contract per AGENTS.md: any UX copy that touches faith, relationships, or
moderation must carry Pastor reasoning before it ships. Engineering does not author this.

This file covers **engine-emitted UX strings only** — the surfaces the matching engine in
`services/matching/` causes the mobile client to show. Onboarding copy (covenant, faith
questionnaire, photo / bio rejection) is owned by `docs/copy/PLACEHOLDERS.md` and was
ingested in BLE-40 (done). Match-event copy was not in that scope and must not be
back-filled with engineer placeholder text.

## Doctrinal posture (applies to every surface in this file)

1. **Imago Dei.** Every candidate on a daily stack is an image-bearer (Gen 1:27, NIV /
   TB2 Kej 1:27). Engine copy must address them and the viewer as people, never as
   inventory ("matches today!", "X new fans").
2. **Sanctity of marriage as covenant.** This product is dating with marriage in view
   (Mal 2:14 the wife of your covenant; Eph 5:25–32, NIV). Match-event copy must not
   over-celebrate a mutual interest as if it were the covenant itself. Mutual interest
   is *permission to begin a conversation*, nothing more.
3. **Loving correction over shaming.** Where the system gates an action (e.g. man
   blocked from sending first message in cross-gender pair per BLE-8 `firstSenderRole`),
   the copy must explain the rhythm graciously. It must never frame the woman as the
   gate or the man as the supplicant.
4. **Anti-spiritual-abuse.** No copy may pressure a user into action under spiritual
   guilt ("a faithful Christian would reach out today"). No copy may use scripture as a
   nudge to convert into-app metrics.
5. **Anti-engagement-loop.** No "matches today!", no streaks, no "X new fans", no
   countdown urgency, no super-like surface. Daily-stack determinism is on our side
   here — copy must reinforce *enough for today*, not *more more more*.
6. **Sabbath / rhythm.** Engine pushes that surface match-event copy must respect the
   per-user `quiet_hours` predicate (Holy Code §7.4). Engine copy itself doesn't need a
   Sunday variant — the *delivery* respects it via BLE-129. But the morning daily-stack
   header, when it does fire, should not feel like a slot machine.

## Cross-tradition smoke test

Every string below was checked against:
- **Catholic** — would a serious Mass-attending single read this without theological
  alarm? (Yes for all canon strings; covenantal framing acceptable across Roman
  Catholic, Eastern Catholic, Orthodox.)
- **Protestant evangelical** — would this read as Bible-grounded, not "Catholic-coded"
  liturgical drift? (Yes; scripture references are biblical, no Marian or sacramental
  language.)
- **Pentecostal / charismatic** — would this read as authentic, not stiff? (Yes; warm,
  invitational, not formal-only.)
- **Mainline Protestant** — would this read as inclusive of doubt-phase or
  recently-returning users? (Yes; no faith-purity policing.)
- **Indonesian (TB / TB2 readers)** — flagged where idioms don't carry; final TB2
  translation lands in BLE-95 followup, not this file.

## Surface 1 — Daily-stack header

Where: top of the daily curated card stack screen. Static for the day per
`(viewer, day)` determinism.

| id | budget | tone | English (NIV-region) |
|---|---|---|---|
| `match.daily.title` | 40 | Quiet, intentional | "Today's people to consider" |
| `match.daily.subtitle` | 90 | Pastoral, no urgency | "A short, prayerful list. Take your time — no need to finish." |
| `match.daily.empty.title` | 50 | Gracious | "No one new today" |
| `match.daily.empty.body` | 200 | Patient, not failure-coded | "We didn't find a good fit for you today. We'll look again tomorrow. Rest is part of this too." |
| `match.daily.exhausted.body` | 200 | Pastoral | "You've seen everyone we found for you today. We'll bring fresh names tomorrow." |

**Doctrinal reasoning.**
- "people to consider" — not "matches", not "candidates", not "picks". They are people.
  Considering before any action is the chastity-of-attention move (Phil 4:8 NIV /
  TB2 Flp 4:8 — "whatever is true … noble … lovely … think about such things").
- "Take your time — no need to finish" — explicit anti-engagement-loop. The daily stack
  *can* be left half-read with no penalty. This is doctrinally load-bearing — it kills
  the gambling loop that hurts users in secular dating apps.
- Empty / exhausted states say "rest is part of this too" / "we'll look again tomorrow"
  — Sabbath rhythm at the copy layer. No "expand your radius!" pressure CTA.

**Rejected alternatives.**
- "Your matches today" → reduces image-bearers to inventory. Out.
- "X new connections waiting!" → engagement-loop / urgency. Out.
- "Don't miss out" → fear-based motivation. Anti-pastoral. Out.
- "Daily blessings" → too cute, weaponizes "blessing" as engagement bait. Out.

## Surface 2 — Mutual-match modal

Where: shown on the device of whichever user completed the mutual (the second-to-tap).
The other side learns by push (per `NotificationDispatcher`) and on next open. Per
`MatchRecord.firstSenderRole`, copy varies by which side gets to open chat.

CEO ratified the **quiet variant** as canon (BLE-8 sign-off, comment 1cc5f0af). The
covenantal variant is held in reserve for a future seasoned-account moment, not used at
first-mutual. Front-running covenant language at first-mutual lands too heavy and
risks the same theological-overreach failure mode that hurt Christian Mingle's voice.

### Canon (quiet variant — ships v1)

Visible on the **woman's device** when she is the second-to-tap in a cross-gender pair
(she holds `firstSenderRole`):

| id | budget | tone | English |
|---|---|---|---|
| `match.mutual.title.opener` | 50 | Quiet, dignified | "[Name] is open to talking" |
| `match.mutual.body.opener` | 220 | Invitational, not pressuring | "A door has opened. There's no rush — send the first message when you're ready." |
| `match.mutual.cta.opener` | 30 | Calm | "Open the chat" |
| `match.mutual.cta.later` | 30 | Gracious | "Maybe later" |

Visible on the **man's device** when he is the second-to-tap in a cross-gender pair
(she holds `firstSenderRole`, he is waiting):

| id | budget | tone | English |
|---|---|---|---|
| `match.mutual.title.waiter` | 50 | Quiet, dignified | "[Name] is open to talking" |
| `match.mutual.body.waiter` | 240 | Pastoral, NOT shaming | "A door has opened. She'll send the first message when she's ready — you'll be notified. Pray for her in the meantime if that's your rhythm." |
| `match.mutual.cta.waiter` | 30 | Calm | "Got it" |

Visible on the **other side's device** when the *first*-to-tap learns of the mutual via
the next-open. Mirror of the variants above based on `firstSenderRole`.

Same-gender pair (deterministic fallback per BLE-8 — `firstSenderRole` = the
second-to-express):

| id | budget | tone | English |
|---|---|---|---|
| `match.mutual.title.symmetric` | 50 | Quiet | "[Name] is open to talking" |
| `match.mutual.body.first_sender` | 220 | Invitational | "A door has opened. Send the first message when you're ready — there's no rush." |
| `match.mutual.body.second_sender` | 220 | Pastoral | "A door has opened. Either of you can open the chat — they'll see it as soon as you send." |

**Doctrinal reasoning.**
- "[Name] is open to talking" — not "It's a Match!". Mutual interest is **a door
  opened**, not a covenant struck. Tone matches Eccl 3:1 NIV ("a time to speak"), not
  a wedding bell.
- "A door has opened" — chosen idiom (echoes Rev 3:8 NIV "I have placed before you an
  open door" without proof-texting it; Luke 11:9 "the door will be opened to you").
  Conveys *opportunity opened, not claimed* — the user still has to walk through
  intentionally.
- For the man: "she'll send the first message when she's ready" — explains the
  rhythm without framing the woman as a gatekeeper. Adds "pray for her in the
  meantime" *as opt-in suggestion* ("if that's your rhythm"), not as obligation. This
  re-channels male initiative into intercession, which is doctrinally load-bearing
  (1 Tim 2:1 NIV — "intercessions … be made for everyone") and undercuts the
  resentment failure-mode of female-first systems.
- "no rush" on the woman's side — explicit refusal to ratchet female-first into
  a 24-hour-or-it-expires Hinge-style pressure. We are not Hinge; we don't punish.
  CEO ratified the anti-clock rule as **founder-level non-negotiable** (BLE-8
  comment 1cc5f0af).
- "You'll be notified" on the man's side — sets expectation. He doesn't need to refresh
  obsessively. We respect his attention.
- No fireworks, no confetti, no animated hearts. Visual treatment is owned by Designer
  (BLE-87) but Pastor opinion: still and warm, not effervescent.

**Rejected alternatives (locked at founder level per BLE-8 comment 1cc5f0af).**
- "It's a Match!" → secular-romance trope, plus over-claims. Permanent ban.
- "Heaven smiles on you" → spiritual-abuse adjacent (claims a divine endorsement on a
  product action). Out.
- "She picked you!" / "You picked each other!" → consumerism frame (picking from a
  catalogue of people). Permanent ban.
- "Your divine appointment is here" → over-realized eschatology of dating. Permanent
  ban.

### Reserve (covenantal variant — held back, NOT shipping v1)

Drafted in case a future seasoned-account moment ticket calls for it (e.g. one-month-of-
conversation milestone). Not used at first-mutual. To use, swap `match.mutual.body.*`:

> "You've each opened the door to a conversation. Marriage is a covenant, and every
> covenant begins with a first word — so begin gently."

CEO held this in reserve per BLE-8 comment 1cc5f0af. **Default to quiet at first-mutual.**

## Surface 3 — Chat-locked state

Where: empty-chat screen shown when chat is unlocked (mutual reached) but no message
has been sent yet. The engine emits `canSendMessage` reason codes; the mobile client
maps them to the strings below.

### 3a. Viewer holds `firstSenderRole` (typically the woman in cross-gender)

| id | budget | tone | English |
|---|---|---|---|
| `chat.empty.opener.title` | 50 | Calm | "The first word is yours" |
| `chat.empty.opener.body` | 220 | Pastoral | "A door has opened. Take your time — when you're ready, send a kind first message." |
| `chat.empty.opener.helperPrompts` | 200 | Optional helper | "Ask about something from their profile. A verse they shared, a place they've been, what they're praying for." |

### 3b. Viewer is waiting (typically the man in cross-gender)

| id | budget | tone | English |
|---|---|---|---|
| `chat.empty.waiter.title` | 50 | Calm, NOT impatient | "[Name] will send the first message" |
| `chat.empty.waiter.body` | 240 | Pastoral, NOT shaming, NOT counting time | "A door has opened. She'll send the first message when she's ready — you'll be notified. There's no clock on your side." |
| `chat.empty.waiter.intercession` | 200 | Opt-in pastoral | "If it's your rhythm, you can pray for her in the meantime." |

### 3c. Engine reason-code mappings (for API → mobile)

| reason | id | English |
|---|---|---|
| `not_mutual` | `chat.error.not_mutual` | "You can't send a message yet — interest hasn't been mutual." |
| `not_first_sender` | `chat.error.not_first_sender` | "[Name] will send the first message. You'll be notified when she does." |

**Doctrinal reasoning.**
- "The first word is yours" — frames female-first as **gift of initiative**, not as
  power-over. Echoes hospitality (Rom 12:13 NIV — "practice hospitality") and Esther's
  "if I perish, I perish" courage but at a much lower stakes register. The woman is
  invited to host the conversation.
- "Take your time" — repeated across surfaces 2 and 3 to compound the no-clock posture.
  This is the difference between BlessCupid and Hinge.
- Helper prompts cite *the other person's profile* (their verse, their place, their
  prayer requests) — keeps the first message about the image-bearer in front of her,
  not about herself or about generic openers. This is the antidote to AI-generated
  pickup-line culture.
- For the waiting viewer: "no clock on your side", "you'll be notified" — denies the
  user the obsessive-refresh rhythm. The intercession line is **opt-in** ("if it's
  your rhythm") and **single-line** (not a guilt sermon). This is the line that the
  Pastor flagged hardest: it must not frame intercession as a price the man pays for
  a response. It is a redirect of energy.
- The `not_first_sender` error must surface to the man only if he somehow bypasses the
  UI gate (deeplink, race condition, malicious client). Default UI should hide the
  message input on the waiter side, not let him tap-and-fail.

**Rejected alternatives (locked at founder level per BLE-8 comment 1cc5f0af).**
- "She has 24 hours to message you" → punitive female-first. Founder-level
  non-negotiable. Out.
- "Tap to nudge her" → spiritual harassment vector. Founder-level non-negotiable. Out.
- "Don't worry, she'll come around" → infantilizing the woman. Out.
- "Use this time to reflect on your worthiness" → spiritual abuse. Out (and yes, real
  apps have shipped variants of this).
- Anything implying the woman owes the man a response. Out.

## Edge cases (covered)

- **Divorced or widowed user.** No copy in this file presumes first-marriage. The word
  "covenant" appears once in the reserve variant only; the canon copy uses
  "conversation" and "open the door" — neutral on history. Pastor does not require
  divorced-state-specific copy at the engine layer. Onboarding handles disclosure.
- **Single parent.** No copy in this file references children, family, or domestic
  setup. Same-as-everyone-else. Good.
- **Doubt / deconstruction phase.** Copy uses no faith-purity language. Helper prompts
  ("a verse they shared, a place they've been, what they're praying for") accept that
  the user may have nothing to say in the verse register and falls through to "place"
  / "prayer request" / their general profile. No string in this file asks the *viewer*
  about their own faith depth. We don't gate the chat opener on faith answers.
- **Recently bereaved.** Edge case for the daily-stack header. The empty / exhausted
  states ("Rest is part of this too") were authored partly with the bereaved-mode user
  in mind. No celebration copy that would land sharply.
- **Mixed-faith household / mixed-tradition couple.** Out of v1 scope (engine
  eligibility gate filters cross-tradition only as soft-score, not as hard-block per
  CEO BLE-8 sign-off). Copy in this file does not editorialize about denomination
  fit. The denomination soft-score is invisible to users by design (per `sanitize.ts`
  hiding score breakdown). Hold the line.
- **Same-gender pair (deterministic fallback per BLE-8).** Founder positioning per
  BLE-2 plan is that the dating surface is opposite-sex. The deterministic fallback
  exists because the engine accepts an unknown-gender path defensively. Copy strings
  for the symmetric case are present so the engine cannot reach a missing-key state,
  and they are doctrinally neutral (no celebration, no editorializing). If the founder
  later removes the same-gender code path entirely, the strings can be deleted with
  no doctrinal cost.
- **Block / unmatch after mutual.** Out of this file's scope — owned by moderation
  (BLE-56). Pastor will author block / unmatch confirmation copy in that file.

## Indonesian (TB / TB2) translation note

These English strings carry idioms that don't translate one-to-one. Specifically:
- "There's no rush" — TB2 working translation: "Tidak perlu terburu-buru" (literally
  "no need to be in a hurry"). Lands cleanly.
- "A door has opened" — TB2 working translation: "Sebuah pintu telah terbuka". Echoes
  the same Rev 3:8 / Luke 11:9 register in TB2; verified pastoral.
- "If it's your rhythm" — idiomatic English. TB2 working translation: "Jika itu
  caramu" ("if that's your way"). Final TB2 lands in BLE-95 follow-up.

Pastor opinion: do **not** ship Indonesian for v1 unless TB2 review is complete.
Default to English-only at launch (Indonesia first-market English-fluent slice is
sizable; rollout sequencing can put TB2 in week 5+).

## What this file does NOT cover (handoffs)

- **Visual layout / typography of these strings** → Designer (BLE-87 / system v0).
  Pastor opinion: airy, sentence-case, not all-caps. No exclamation marks.
- **Push-notification body copy** for `mutualMatch` and `messageReceived` → owned in a
  separate Pastor delivery alongside BLE-129 (quiet-hours predicate wire-up). Will
  follow same posture as the in-app modal.
- **Conversation-prompt seed list (30 prompts)** → BLE-95 §6, separate file
  `docs/copy/conversation-prompts.md`.
- **Action verbs canon** (pass / accept / express-interest verbs across the app) →
  BLE-95 §1, separate file `docs/copy/action-verbs.md`. The strings in *this* file use
  "say yes" colloquially; the canonical verb may be different. When `action-verbs.md`
  lands, sweep this file for consistency.
- **Holy Code §7.4 quiet-hours per-user wiring** → BLE-129 (Engineering).

## Sign-off

Pastor canon for engine-emitted UX strings on the three CEO-named surfaces is above.
Copy is doctrinally grounded, denominationally inclusive, anti-engagement-loop, and
honors the female-first first-sender semantic without shaming the waiter. Quiet
variant is canon (CEO ratified, BLE-8 comment 1cc5f0af); covenantal variant held in
reserve.

Engineering: ingest into the i18n bundle alongside the existing onboarding keys. The
engine itself does not change — it already emits the right reason codes
(`not_mutual`, `not_first_sender`) and `firstSenderRole`.

Designer: visual treatment per BLE-87. Pastor preference is still / warm, not
effervescent. No confetti.

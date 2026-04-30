# BLE-31 — BlessCupid Report-Triage Doctrine Guide

Owner: Pastor agent
Audience: Moderators (human-review queue), FoundingEngineer (admin console wiring), Designer (tone reference)
Status: v1.3 — auto-mute bundle + harassment-ban scripture-omit rule clarified after BLE-109 review
Last updated: 2026-04-28

## Amendments (v1.2 → v1.3)

After BLE-109 lo-fi pastoral tone surfaces review by FoundingDesigner:

1. **Auto-mute bundle is distinct, not a reuse of `(harassment, removal)`.** Surface 2 in BLE-109 reused §5.1 `removal` body. Doctrinally incorrect — audience differs:
   - `(harassment, removal)` body addresses the **offender** ("we removed your message…").
   - `(auto-mute, notification)` body addresses the **muter / protected user** (someone the system muted on their behalf after `human-review` confirmed action). Different referent → different copy → distinct bundle key required.
   - Canonical bundle below; engineering keys as `(auto-mute, notification)` with no category sub-key (auto-mute is category-agnostic — fires from any category's `human-review` outcome).

   **`(auto-mute, notification)` — Voice 02 (post-action cobalt-soft)**

   ID — *"Kami sudah mute {nama} dari kotak masukmu. Tim kami baru saja menyelesaikan tinjauan terhadap laporan dari anggota lain dan memutuskan untuk bertindak — jadi kamu tidak perlu lihat pesannya lagi sampai kamu sendiri yang memilih sebaliknya. Kamu bisa unmute kapan saja dari pengaturan."*

   EN — *"We've muted {name} from your inbox. Our team just finished reviewing another member's report and decided to act — so you don't need to see their messages again unless you choose otherwise. You can unmute anytime from settings."*

   Doctrinal notes: agency-preserving present tense ("kami sudah mute" / "we've muted"), names the trigger as `human-review` outcome (not raw report count, per v1.1 §1), names reversibility (one-tap unmute) so the protection feels offered, not imposed. No scripture in this bundle — the muter is the protected party, not the actor; verse weight is reserved for the actor-facing voices.

2. **§1 harassment ban does not carry scripture in surface render.** Per BLE-55 §5.1 verbatim copy bundle, `(harassment, ban)` ships **without** scripture. The §6 layout rule ("omit when doctrine bundle has no quote, never replace with placeholder") supersedes BLE-109 surface scope that asked for a gold-rule mark. Proposed Mat 7:12 (Golden Rule) candidate is **rejected** for harassment ban specifically because:
   - The `(harassment, ban)` body is constructed to deny verdict-register ("Ini bukan penghakiman atas dirimu" / "This isn't a verdict on who you are"). Adding the Golden Rule reads as "you didn't follow this, therefore ban" — which is precisely the verdict register the body refuses.
   - James 3:9-10 is in the §1 scripture pool but was intentionally not used in the BLE-55 verbatim copy bundle for the same reason — same-tongue-praising-and-cursing is a precision instrument for slur/threat/doxx where the *speech act itself* is the violation; for the broader harassment ban which includes pattern-of-contact-after-no, it can over-determine.
   - Designer should render the gold-rule scripture frame slot **empty** for `(harassment, ban)` — no decorative replacement, no placeholder text. Visual weight in that frame slot uses the cobalt-100 disc + open-door glyph alone. Per §6 iron rule.
   - This sets the general pattern: when BLE-55 §5 verbatim bundle has no scripture, the surface omits the frame entirely.

3. **Three BLE-26 spec rev 2 carry-forward open questions ratified:**
   - 24h-reflection copy *"sometimes a night of prayer changes things, sometimes it doesn't"* — APPROVED. Doctrinally honest: refuses to instrumentalize prayer as a guaranteed mechanism, respects the person sitting in real ambiguity. Reformed / Catholic / Pentecostal traditions all accept that prayer is communion, not a vending machine.
   - Empty-state copy *"a conversation that points somewhere meaningful"* — APPROVED. *Meaningful* is open enough not to over-determine; faith-aware without preaching.
   - Reported-message reveal placeholder *"Kami simpan dulu pesan ini. / We held this one for you."* — APPROVED. Strongly preferred over rev 1's amber + "may include language we coach". *Held for you* is recipient-honoring, implies care not censorship, and matches Voice 02 cobalt-soft register exactly.

## Amendments (v1.1 → v1.2)

After review of BLE-57 three-voice draft + bilingual templates by FoundingDesigner:

1. **§10 Pastoral Tone Reference ratified** as canonical. Three-voice pattern (compose-time yellow-warm / post-action cobalt-soft / ban cream+gold) is now the binding voice contract for BLE-26 chat moderation banners and BLE-27 report flow. Pastor refinements absorbed inline in §10 below.
2. **Appeal email path: `care@blesscupid.app`** replaces `care@blesscupid.app` everywhere in user-facing copy (warnings, removals, bans). Reason: *appeals* carries tribunal/judicial register; *care* carries pastoral register. The footer-contact path is itself the door — and "Door back in" framing demands a pastoral verb on the door. Internal Legal mailbox `care@blesscupid.app` may continue for inbound routing if Engineering needs it; do not surface to users.
3. **Surface copy verb for permanent action: "hentikan / akhiri", not "blokir".** *Blokir* in Bahasa carries the same penal/judicial weight that *block* does in English (consistent with §10 forbidden vocabulary). Use "**Akun kami hentikan secara permanen**" or "**kami akhiri secara permanen**" on ban surfaces. Internal enum stays `ban`. The §1 / §3 ban templates below are updated accordingly.
4. **Faith-origin protection codified.** Convert-from-Islam status (and any analogous convert origin: Hindu/Buddhist/atheist-to-faith) is **never** surfaced in user-facing moderation copy regardless of context. The doctrine governs the moderation logic; the *copy layer* never reveals the flag. See §10 forbidden surfacing list. Pastor doctrinal reason: belonging in Christ is what counts (Gal 3:28); operational reason: surfacing apostasy origin in Indonesia creates physical-safety risk and is itself a duty-of-care violation.

## Amendments (v1 → v1.1)

After review of BLE-55 tone-adoption doc by FoundingDesigner:

1. **Auto-mute trigger resolved.** §13 open item (was: "Nth report count vs human-review outcome") is now closed. **Auto-mute fires on the first `human-review`-confirmed action against a member, never on raw incoming report count.** Reason: raw-count triggers punish unpopular members and create a weaponizable false-report vector. Outcome-triggers require moderator judgment, which keeps grace in the loop. Voice on auto-mute notification = post-action cobalt-soft (per BLE-55 §1).
2. **Hard-pause / hard-block split.** Surface copy says *"hard pause"*. Internal enum stays `hard-block` for engineering compatibility. Reason: *block* drifts toward forbidden vocabulary (see §10). Apply to BLE-26 + BLE-27 surfaces.
3. **Panic-exit red exception** to the moderation-never-uses-red rule. Red is permitted **only** on the panic-exit affordance + its confirmation modal — it points outward at the threat (protection of the threatened), not inward at the user being acted upon (judgment of the actor). Scope rules:
   - Red MUST NOT appear on the report flow, removal notices, ban surfaces, compose-time hard-pause, or chat moderation banners.
   - If a user is *receiving* moderation, red is forbidden. If a user is *escaping* a threat, red is mandatory (urgent-help register).
   - Use a separate design token (e.g. `state/panic-exit`) so the panic-exit red cannot inherit `state/danger` styling elsewhere.

---

## Doctrinal Posture (read first)

BlessCupid is a faith-first dating app. Moderation is **pastoral, not corporate**. Every action — even a ban — is framed as a call back to dignity, truth, and Christ. We do not shame; we correct. We do not scold; we redirect. We are slow to anger, quick to listen (James 1:19), but we protect the flock from wolves (Acts 20:29).

**Three severity tiers**

- **auto** — System acts without human review. Reversible by appeal. Used only for high-confidence, low-ambiguity violations.
- **human-review** — Routed to moderator queue. Default tier when context matters.
- **escalate-CEO** — Legal exposure, brand risk, mass-harm pattern, or doctrinal precedent. Pastor + CEO co-decide.

**Copy template structure** — Every outbound message has four parts:

1. **Name what was seen** (specific, not vague).
2. **Name the harm** (to the other person, to the community, to the actor's own walk).
3. **Name the action** (warning / removal / ban) and why this tier.
4. **Door back in** — appeal path or, where applicable, restoration path. We never close the door without leaving a key.

Tone: warm, plain, never sarcastic, never KJV-cosplay. Scripture is offered, not weaponized. Always include a translation note (NIV default, ESV when precision matters, NLT when accessibility matters).

---

## 1. Harassment

**Definition.** Repeated, targeted, unwelcome contact after a clear stop signal; threats of violence; slurs (racial, ethnic, religious, gendered, ability); doxxing; coordinated pile-ons. One sharp comment in a heated DM is not harassment — a pattern of contact after "stop" is.

**Severity tier**

| Pattern | Tier |
|---|---|
| Slur (any protected class), explicit threat, doxx | auto |
| Repeated contact after block/stop signal | auto (after 2nd attempt) |
| Hostile tone, single instance, ambiguous intent | human-review |
| Pile-on / coordinated targeting | escalate-CEO |

**Copy — Warning (single hostile message, ambiguous)**

> We saw the message you sent to [Name] on [date]. The words landed as harassment, even if that wasn't your aim. Please pause before sending heat — the person on the other side is a brother/sister made in God's image (Gen 1:27). One more incident like this will lead to removal. Reply if you believe we got this wrong.

**Copy — Removal (clear pattern)**

> Your account is being removed for harassment of [Name] across [N] messages between [dates]. We asked you to stop. You kept going. BlessCupid exists to help people find love in safety; that requires we honor "no." You may appeal within 14 days at care@blesscupid.app.
>
> "Whoever guards his mouth and tongue keeps himself out of trouble." — Proverbs 21:23 (ESV)

**Copy — Ban (slur / threat / doxx)**

> Your account is permanently ended for [slur / threat / sharing private information about another member]. This is not who we are. This is not who Christ calls us to be. Words like these wound real people; we will not host them.
>
> "With the tongue we praise our Lord and Father, and with it we curse human beings, who have been made in God's likeness. Out of the same mouth come praise and cursing. My brothers and sisters, this should not be." — James 3:9-10 (NIV)
>
> If you believe this was an error of identity (account compromised), reply within 14 days.

**Scripture pool**

- Ephesians 4:29 (NIV) — "Do not let any unwholesome talk come out of your mouths, but only what is helpful for building others up..."
- Proverbs 15:1 (NIV) — "A gentle answer turns away wrath, but a harsh word stirs up anger."
- Matthew 5:22 (NIV) — "Anyone who says to a brother or sister, 'Raca,' is answerable to the court."

---

## 2. Sexual content / solicitation

**Definition.** Unsolicited explicit imagery; sexual propositions before mutual consent + meeting threshold; requests for nudes; sexually explicit language pushed on uninterested party; any sexual content involving minors (zero tolerance, immediate legal escalation).

**Severity tier**

| Pattern | Tier |
|---|---|
| CSAM (any) | escalate-CEO + NCMEC report (legal req) |
| Unsolicited explicit imagery | auto-removal of media + human-review for account |
| Solicitation of nudes | human-review |
| Sexual language to uninterested party (after stop) | auto |
| Mutual, opted-in spicy DMs (consenting adults) | not actionable — outside policy |

**Copy — Warning (sexual language pushed past discomfort)**

> [Name] told you they weren't comfortable with where the conversation was going. You sent a sexual message anyway. BlessCupid is for marriage-minded relationships, and even outside that — pressing past a "no" is never love (1 Cor 13:4-5). Please don't do this again. Next instance is removal.

**Copy — Removal (unsolicited explicit imagery)**

> You sent explicit imagery to [Name] without their consent. The image has been removed and your account is being removed from BlessCupid. What you sent is not flirting; it is a violation. We treat the bodies of our members — and your body — as worthy of more honor than that.
>
> "Flee from sexual immorality... You are not your own; you were bought at a price. Therefore honor God with your bodies." — 1 Corinthians 6:18-20 (NIV)
>
> Appeals: care@blesscupid.app within 14 days.

**Copy — Ban (CSAM — Pastor does not draft, CEO + Legal own this path)**

Banner only: "Account permanently terminated. Reported to law enforcement." No scripture, no pastoral framing. CEO + Legal handle all communication.

**Scripture pool (non-CSAM)**

- 1 Thessalonians 4:3-5 (NIV) — "It is God's will that you should be sanctified: that you should avoid sexual immorality; that each of you should learn to control your own body in a way that is holy and honorable..."
- Song of Songs 2:7 (NIV) — "Do not arouse or awaken love until it so desires." (For solicitation cases — gentle, beautiful, not punitive.)
- Matthew 5:28 (NIV) — Use sparingly. Often misused as a club. Reserve for unrepentant sexual coercion patterns.

---

## 3. Fake profiles

**Definition.** Profile uses someone else's photos (catfish), AI-generated face, or claims an identity the actor is not (gender, age, marital status, faith). Sub-types matter: catfish for romance scam ≠ closeted lonely person using a stock photo. Both wrong; only one is malicious.

**Severity tier**

| Pattern | Tier |
|---|---|
| Reverse-image hits known scam pattern | auto |
| AI face (high-confidence detector) + low engagement | auto |
| Photo mismatch flagged by match | human-review |
| Identity claim mismatch (age/marital) | human-review |
| Catfish + financial ask (see also Financial) | escalate-CEO |

**Copy — Warning (photo mismatch, benefit of doubt)**

> A member flagged that your photos may not be of you. We're not accusing — sometimes profiles use older photos or borrowed ones. Within 7 days, please verify with a live selfie ([link]). Until then, your profile is paused. We do this because love starts with truth (Eph 4:25).

**Copy — Removal (verified catfish, no financial element)**

> We confirmed the photos on your profile belong to someone else. Your account is being removed. We don't know your story, and we're not here to humiliate you — but BlessCupid only works if the person on each side is real. If your story is "I was lonely and didn't think I was enough," we hear you, and we believe you are. Come back as you. The door is open: care@blesscupid.app.
>
> "Therefore each of you must put off falsehood and speak truthfully to your neighbor, for we are all members of one body." — Ephesians 4:25 (NIV)

**Copy — Ban (catfish + scam pattern)**

> Your account is permanently ended for impersonation tied to a known fraud pattern. Photos belonging to [redacted] were used to deceive multiple members. This was not loneliness; this was theft of trust.
>
> "The Lord detests lying lips, but he delights in people who are trustworthy." — Proverbs 12:22 (NIV)

**Scripture pool**

- Ephesians 4:25 (NIV) — putting off falsehood.
- Proverbs 12:22 (NIV) — lying lips vs. trustworthy people.
- 1 John 1:6 (NLT) — "If we say we have fellowship with him and yet walk in darkness, we lie and do not live out the truth." (For faith-claim mismatches.)

---

## 4. Off-platform pressure

**Definition.** Pushing a match to move to WhatsApp/LINE/Telegram/Signal/email before mutual readiness; sharing burner numbers in opening messages; QR codes; "I don't use this app, text me at..." in bio. Off-platform itself is fine *eventually* — premature pressure is the violation, because it removes the safety net.

**Severity tier**

| Pattern | Tier |
|---|---|
| Burner/QR in bio or opener | auto (mask + warn) |
| "Move to WhatsApp" in first 3 messages | human-review |
| Repeated push after match said "let's stay here" | auto |
| Off-platform push + scam keywords | escalate-CEO (route via Financial) |

**Copy — Warning (asking too early)**

> You asked [Name] to move to [WhatsApp / LINE / etc.] in your [first / second] message. We get it — apps are clunky. But moving off-platform too early removes the safety tools that protect both of you. Let trust build here first. If [Name] is comfortable, they'll lead.

**Copy — Removal (repeated push after stop)**

> [Name] told you they wanted to keep talking on BlessCupid. You kept asking. Pressuring someone to leave the platform after they've said no is a red flag we take seriously — usually for the person being pressured, sometimes for the person doing the pressuring. Account removed. Appeal: care@blesscupid.app.
>
> "Love does not insist on its own way." — 1 Corinthians 13:5 (ESV)

**Copy — Ban (off-platform + financial pattern)**

See Financial section — this is the more serious framing.

**Scripture pool**

- 1 Corinthians 13:5 (ESV) — love does not insist on its own way.
- Proverbs 27:12 (NIV) — "The prudent see danger and take refuge."

---

## 5. Financial / scam

**Definition.** Asking matches for money, gift cards, crypto, or "investment opportunities"; sob stories with payment ask; sharing trading platforms (pig butchering); claiming to be deployed military, oil rig, doctor abroad needing emergency funds; charging for spiritual services ("I'll pray over you for $X"); MLM recruitment.

**Severity tier**

| Pattern | Tier |
|---|---|
| Direct money/crypto/gift-card ask | auto |
| "Pig butchering" trading invite | auto |
| MLM recruitment | auto |
| Charging for prayer/prophecy | human-review (often a real person needing pastoral correction, not always a scammer) |
| Sob-story + soft money ask | human-review |
| Coordinated scam ring (multiple accounts, same script) | escalate-CEO + report |

**Copy — Removal (direct ask)**

> Your account is being removed for asking [Name] for [money / a gift card / crypto / investment funds]. BlessCupid is not a fundraising platform. If your situation is real, your church, your family, or local aid will help — your match is not the right asker. If your situation is not real, please understand: people send money because they believed you cared. That is not a small wound.
>
> "Keep your lives free from the love of money and be content with what you have." — Hebrews 13:5 (NIV)

**Copy — Ban (pig butchering / scam ring / MLM after warning)**

> Your account is permanently ended for [coordinated investment fraud / continued MLM recruitment / scam pattern matched to known ring]. We have flagged the relevant accounts to other platforms via [shared safety consortium reference, when applicable]. Anyone you defrauded should reach out to local authorities; we are cooperating with investigators where requested.
>
> "Dishonest money dwindles away, but whoever gathers money little by little makes it grow." — Proverbs 13:11 (NIV)

**Copy — Pastoral note (charging for prayer — often misguided, not malicious)**

> A member flagged that you offered to pray for them in exchange for payment. We don't believe you meant harm, but selling spiritual services puts you on shaky ground (Acts 8:18-23 — Simon the Magician). Please remove the offer from your profile and DMs. Prayer is free; you are loved without charge.

**Scripture pool**

- 1 Timothy 6:10 (NIV) — "For the love of money is a root of all kinds of evil..."
- Hebrews 13:5 (NIV) — contentment.
- Acts 8:18-23 (NIV) — Simon the Magician (specific to monetized "spiritual" services).
- Proverbs 13:11 (NIV) — dishonest money dwindles.

---

## 6. Doctrinal disputes

**Definition.** This is the hardest category. BlessCupid serves Christians across denominations (Catholic, Orthodox, Protestant — Evangelical / Mainline / Pentecostal / Reformed). We hold the Apostles' Creed and the Nicene Creed as the floor. Above that floor we host disagreement. Below that floor we do not.

**Three sub-categories**

- **Heresy below the creedal floor** — denying Trinity, denying bodily resurrection, denying Christ's deity, prosperity gospel as core teaching, Mormon/JW theology presented as orthodox Christian. Action: removal.
- **Sectarianism** — "real Christians don't [wear pants / drink wine / take communion in your tradition / vote your way]". Action: warning, then removal.
- **Tertiary disagreement** — paedo vs. credo baptism, cessationism vs. continuationism, eschatology, women in ministry, alcohol, etc. Action: not moderated. Members may filter for compatibility; we do not pick a side.

**Severity tier**

| Pattern | Tier |
|---|---|
| Public denial of Trinity / Resurrection / Christ's deity | human-review (verify intent — could be a seeker asking, not a teacher claiming) |
| Prosperity gospel as identity / pressuring matches | human-review |
| Sectarian attacks ("you're not a real Christian because...") | auto-warning, then human-review |
| Tertiary doctrine disagreement | not actionable |
| Predatory teaching (luring vulnerable matches into a known cult) | escalate-CEO |

**Copy — Warning (sectarian attack)**

> You told [Name] they "aren't a real Christian" because [specific issue]. BlessCupid hosts believers across traditions who all confess Jesus is Lord (Rom 10:9). Disagreement is allowed — disqualifying a brother or sister over a tertiary issue is not. Please don't repeat this. Compatibility is for filters; correction is for elders.

**Copy — Removal (heresy taught aggressively, not seeking)**

> Your account is being removed for repeatedly teaching [specific heresy — e.g., denial of Christ's full deity] to other members after our warning. We are not the church's magisterium — we host across traditions — but the historic creeds are our floor. We hope you sit with a pastor in your local body and wrestle with these questions there, not in DMs with strangers seeking love.
>
> "Watch your life and doctrine closely. Persevere in them, because if you do, you will save both yourself and your hearers." — 1 Timothy 4:16 (NIV)

**Copy — Ban (predatory cult recruitment)**

> Your account is permanently ended for cult-recruitment activity tied to [group name, where confirmed]. Members trusted you with their hearts; you used that trust to pull them toward a system that has documented harm. We are notifying matches you contacted.
>
> "Watch out for false prophets. They come to you in sheep's clothing, but inwardly they are ferocious wolves." — Matthew 7:15 (NIV)

**Copy — Non-action notice (tertiary, when one party reports the other)**

> Thanks for the report. We looked at the conversation. The disagreement you had with [Name] about [baptism / end times / women in ministry / etc.] is one Christians have held different views on for centuries. We don't moderate tertiary doctrine — but you can adjust your match filters to prefer [the relevant filter], which will reduce these matches.

**Scripture pool**

- Romans 10:9 (NIV) — confession that Jesus is Lord.
- 1 Timothy 4:16 (NIV) — watch life and doctrine.
- Matthew 7:15 (NIV) — false prophets / wolves.
- Romans 14:1-12 (NIV) — disputable matters; the chapter every moderator should read once a quarter.

---

## §7 — §9 Reserved

Reserved for v2 work: false-report patterns (§7), repeat-offender ladder + cooldowns (§8), quarterly calibration-drift review (§9). See Handoff. §10 numbering preserved per BLE-57 reference.

---

## §10 Pastoral Tone Reference

This section governs the *voice* of every moderation surface — chat banners, report sheets, removals, bans. Severity tiers (auto / human-review / escalate-CEO) decide *whether* to act; §10 governs *how it sounds* when we act. Both axes apply simultaneously.

Three voices map to three temporal positions in the user's journey through a moderation event:

### Voice 01 — Compose-time

> *Honest friend, not buddy. "Hold up — eyes on what you typed."*

- **When:** preflight classifier flags risk on a draft message *before send*.
- **Visual register:** yellow-warm. Gold-100 → amber-100 gradient. Gold-500 left rule.
- **Behavior:** **never blocks.** Both "Edit dulu" and "Tetap kirim" stay clickable. Friction, not gate. The user retains agency; we offer a held mirror.
- **Voice:** gentle, present-tense, second-person ("kamu" / "you"). Imperative softened by relational warmth. NOT corporate ("violation detected"). NOT church-bulletin ("Beloved..."). NOT chummy ("hey friend!"). Older sibling who has been there.
- **Scripture:** none. The verse weight belongs to Voice 03; surfacing it here cheapens it.
- **Doctrinal anchor:** Prov 27:6 (NIV) — "Faithful are the wounds of a friend." Compose-time is the friend wound: small, kind, ahead of harm.

### Voice 02 — Post-action

> *Calm explainer, not drumbeat. "Here's what happened. Here's the door back."*

- **When:** a message was hidden, account paused, match removed by safety, or a report was actioned.
- **Visual register:** cobalt-soft. Cobalt-50 fill, cobalt-100 border, cobalt-900 headline. No alert iconography — info or shield glyph only.
- **Behavior:** dismissible but persists in safety center until appeal window closes (default 14 days). Always names the action, the reason, and the appeal path.
- **Voice:** explainer, third-person about the action ("Kami sembunyikan satu pesan" — "We hid one message"). Calm, not apologetic. Not breezy. The voice of an elder explaining a parish decision over coffee.
- **Scripture:** **not in headline.** Optional supporting note only when category is doctrinal or §2 / §5 ban-tier — and never as a sermon block. Save the verse for Voice 03.
- **Always render:** `care@blesscupid.app` link + appeal window. Always.
- **Doctrinal anchor:** James 1:19 (NIV) — "quick to listen, slow to speak, slow to become angry." Post-action is the slow-speak voice.

### Voice 03 — Ban / serious notice

> *Warm, never red. Pintu pemulihan tetap terbuka. "This is real. So is the door back."*

- **When:** account removed or banned (any §1–§6 ban-tier).
- **Visual register:** cream canvas. Gold-accent crest — **dove only** (Holy Spirit / restoration; Matt 3:16, Mark 1:10, Luke 3:22, John 1:32). Cobalt CTA. Verse blockquote rule in gold-500. **Forbidden visual signifiers:** red color (anywhere on this surface), warning triangle, circle-X, exclamation-mark glyph, lock-and-chain, gavel.
- **Structure (canonical, four-part):**
  1. **Name what was seen** — specific, not vague.
  2. **Name the harm** — to the other person, to the community, to the actor's own walk.
  3. **Name the action** — removal / ban / why this tier.
  4. **Door** — appeal path or restoration path. Always rendered, even when symbolic. The label "**Pintu pemulihan tetap terbuka**" (the door of restoration remains open) is fixed canonical framing across all bans.
- **Voice:** grave, not angry. Names the person if known. Says "we don't know your story" when compassion is structurally appropriate (catfish-from-loneliness, financial-from-desperation, sectarianism-from-formation). Names the wound to the other party plainly.
- **Scripture:** optional, supporting only — **never the headline.** Set in gold-rule blockquote with translation cite ("Efesus 4:25 · TB · catatan pastoral, bukan vonis" — "pastoral note, not a verdict"). Omit the entire blockquote when actor profile flags atheist / agnostic / seeker, or when the category is CSAM / scam-ring (per §2 / §5).
- **Doctrinal anchor:** Gal 6:1 (NIV) — "Restore that person gently. But watch yourselves..." The ban screen is the gentleness clause and the watch-yourself clause held in the same hand.

### §10.4 Forbidden vocabulary (all voices)

These phrases or their close cognates may not appear in any user-facing moderation surface:

- **Judicial/penal:** "violation detected", "you are guilty of", "verdict", "sentence", "you have been judged", "punishment", "we have decided against you", "convicted of"
- **KJV-cosplay or church-bulletin:** "Beloved...", "Dear sinner...", "Verily I say unto thee", "Brethren", "saint" or "sinner" used as direct address, "thee/thou"
- **Friendly-corporate:** "We appreciate your patience", "Your safety is our top priority", "Thank you for your understanding", "Have a blessed day!", "We value your trust"
- **Bahasa-specific drift to avoid:** "akun **diblokir**" on user-facing surface (use "kami hentikan / kami akhiri"), "**dilarang**" (forbidden — penal register; prefer "tidak diizinkan" or describe action directly), exclamation-driven panic copy
- **Surveillance language:** "we are watching you", "your behavior has been logged", "we have records of"
- **Sarcasm or passive-aggression:** any. Zero tolerance.

### §10.5 Forbidden surfacing (faith origin protection)

The following user attributes **must never** appear in user-facing moderation copy regardless of moderation context, language, or category:

- Convert-from-Islam status (most safety-critical in Indonesia)
- Convert-from-other-faith status (Hindu / Buddhist / Catholic / Protestant tradition origin)
- Atheist / agnostic / seeker history before profession
- Denominational specifics that the user did not themselves surface in profile
- Marital history (divorced, widowed, annulled) unless directly relevant to the moderation action and the user has surfaced it in their own profile
- Mental-health flags, addiction-recovery flags, abuse-survivor flags

Engineering implementation: `account.flags.faith_origin_protected` defaults to `true` for any account whose profile self-declares conversion. Copy generator strips origin-revealing phrasing when this flag is set. Pastoral logic may still inform moderator decisions in the back office; the *user-visible* copy never references it.

Doctrinal reason: in Christ neither Jew nor Greek, neither slave nor free (Gal 3:28). Belonging is what counts; arrival path is between the user and God. Operational reason: in Indonesia (and across MENA / parts of South Asia), surfacing apostasy origin can produce physical-safety, social-ostracism, and family-pressure consequences that BlessCupid has no right to trigger on behalf of a moderation event.

### §10.6 Translation cite contract

Every surfaced verse renders with a translation cite. Conventions:

- **Bahasa:** TB (Terjemahan Baru) is canonical. TB2 acceptable when TB is ambiguous; cite explicitly. Cite format: "*Efesus 4:25* · **TB**".
- **English:** NIV default. ESV when precision matters (doctrinal-dispute removals, Proverbs literary-form, 1 Cor 13:5 "love does not insist on its own way"). NLT when accessibility matters (younger members, ESL).
- **Cite line MUST include the soft pastoral disclaimer** when verse is on a Voice 03 ban screen: "catatan pastoral, bukan vonis" / "pastoral note, not a verdict". This sentence prevents readers from receiving the verse as the judgment instrument; the verse is offered, not weaponized (per Doctrinal Posture preamble).

### §10.7 Severity ↔ Voice mapping

| Tier (decides) | Voice (sounds) | Surface |
|---|---|---|
| auto (preflight) | Voice 01 | Compose-time banner before send |
| auto (post-send) | Voice 02 | Post-action banner in thread + safety center |
| human-review | Voice 02 (warning, removal) → Voice 03 (ban) | In-thread + safety center → full-screen takeover |
| escalate-CEO | Voice 03 only (no Voice 01/02 for these — the action when it lands is grave) | Full-screen takeover |

Designer enforces voice in surface treatment; Engineering enforces tier in classifier + queue routing. Pastor signs off on copy strings per category × tier.

---

## Operational Notes for Moderators

1. **Default to human-review when context is ambiguous.** A wrong auto-action breaks trust faster than a slow one.
2. **Never copy-paste the templates verbatim.** Adapt the named details. Members notice form letters and feel them as dehumanizing.
3. **Always include the appeal path** for warnings and removals. Bans for slurs/threats/doxx/CSAM/scam-ring may omit if legal advises.
4. **Scripture is optional, not required.** If the actor's profile flags atheist/agnostic/seeker, drop scripture and keep the pastoral substance. Truth doesn't need a verse to be true.
5. **Translation notes matter.** Default NIV. Use ESV for precision (doctrinal disputes). Use NLT for accessibility (younger members, ESL).
6. **Document every escalate-CEO** with timeline, evidence links, and recommended action. Pastor reviews within 24h, CEO within 72h.

---

## Handoff

- **FoundingEngineer (admin console)** — Severity tiers map cleanly to three queue lanes: `auto` (logged, not surfaced), `human-review` (moderator queue), `escalate-CEO` (pastor + CEO joint queue). Copy templates should be selectable from a dropdown per category, with named-field substitution (`{name}`, `{date}`, `{N}`, `{specific_issue}`). Appeal link is constant. Scripture is a separate dropdown so moderators can swap.
- **Designer (tone reference)** — Visual register for moderator-facing UI: warm but serious. Not friendly-corporate ("we appreciate your patience"). Not church-bulletin ("Beloved..."). Plain, adult, kind. The copy templates above are the canonical voice — match the UI to them.
- **Pastor (next iteration)** — v2 should add: false-report patterns (people weaponizing the report tool against ex-matches), repeat-offender ladder (warning → removal → ban thresholds with cooldowns), and a quarterly review process where flagged-but-not-actioned cases are sampled for calibration drift.

---

*"Brothers and sisters, if someone is caught in a sin, you who live by the Spirit should restore that person gently. But watch yourselves, or you also may be tempted."* — Galatians 6:1 (NIV)

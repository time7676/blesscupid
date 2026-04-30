# BlessCupid — Designer i18n Style Guide

**Audience:** FoundingDesigner + anyone authoring copy in Figma.
**Goal:** ship Figma → engineering with zero re-translation, zero broken layouts when copy expands.

---

## 1. Bahasa is primary. English is secondary.

- All Figma frames carry **Bahasa Indonesia** as the visible string.
- English appears as a **secondary annotation** in the same frame (small grey text, or a sidebar component) — never as the active layer.
- If the Bahasa version is missing, the screen is **not ready for engineering**.

## 2. Every string has a String ID.

- String ID is namespaced dot-path: `match.feed.empty.title`, `auth.otp.resend`.
- Attach the ID to the text layer via Figma plugin (e.g. `Localazy`, `Lokalise`, `Crowdin`) or as a layer suffix `[match.feed.empty.title]`.
- Engineers never re-type the Bahasa string. They reference the ID via `t('match.feed.empty.title')`.
- New strings introduced by design get IDs **before** dev hand-off, not after.

## 3. Length budget — Bahasa is ~20–35% longer than English.

Design at **Bahasa length**, not English.

| Element | Max char (Bahasa) | Max char (English) |
|---|---|---|
| Primary CTA button | 22 | 16 |
| Secondary CTA / chip | 18 | 14 |
| Card title | 32 | 26 |
| Card subtitle | 60 | 48 |
| Empty-state title | 36 | 28 |
| Empty-state body | 120 | 96 |
| Error toast | 80 | 64 |

If Bahasa overflows the budget, **shorten the Bahasa**, don't expand the box. Engineers cannot ship layouts that break when locale switches.

## 4. Type tokens accommodate the longer language.

Design tokens (see `tokens.css` in sibling tasks) define line-height and letter-spacing assuming Bahasa fits. When in doubt, run the longest Bahasa string through the component and verify wrap.

Test components at **Bahasa-XL**: take the longest visible string, append " *(panjang)*", verify nothing clips.

## 5. Voice & tone

- **Bahasa**: warm, polite, second-person familiar (`kamu`/`kamu`). Never `Anda` for body copy except formal screens (consent, ToS, error states tied to legal).
- **English**: warm, modern, second-person (`you`). Match Hinge / Coffee Meets Bagel register, not Tinder.
- **Faith language**: gentle, inclusive across denominations (Katolik, Protestan, Kharismatik, Injili, Ortodoks). Avoid words tied to one tradition only ("Misa", "KKR", "kebaktian khusus") in shared copy.
- **No slang** that reads dated. Avoid "bestie", "bro", "ciee".
- **No gendered phrasing** in either locale. Use:
  - Bahasa: `mereka`, `pengguna`, `orang ini`.
  - English: `they / them`, `this person`, `the user`.
- **Faith strings (`faith.*`)** must be reviewed by the Pastor agent before merge. Flag in PR.

## 6. Numbers, dates, currency — use the formatters, not literal text.

- Don't bake `"Rp 50.000"` into a string. Use `{amount}` placeholder and let `useLocaleFormatters().idr(50000)` render it.
- Don't bake `"3 hari yang lalu"`. Use `{when}` and `formatters.ago(timestamp)`.
- Don't bake `"50%"`. Use `{ratio}` and `formatters.percent(0.5)`.

This guarantees `Rp 50.000` (id-ID) vs `IDR 50,000` (en-US) render correctly.

## 7. Pluralization — never hardcode "1 orang" / "2 orang".

Use ICU plural form in the JSON, not three separate keys.

```json
"resend": "Kirim ulang dalam {seconds, plural, one {# detik} other {# detik}}"
```

In Bahasa, `one` and `other` are usually identical (no plural inflection). In English, they differ. Designers don't write the JSON — they write `{n} detik` in Figma and tell engineers "this needs ICU plural for `seconds`".

## 8. Variables — use named placeholders.

| Bahasa | English | Variable |
|---|---|---|
| `Halo, {name}!` | `Hi, {name}!` | `{name}` |
| `{km} km dari kamu` | `{km} km away` | `{km}` |
| `{percent}% selesai` | `{percent}% complete` | `{percent}` |

Never positional `{0}`, `{1}`. Always named.

## 9. Hand-off checklist (per screen)

- [ ] Every text layer has a String ID
- [ ] Bahasa version is complete and at length budget
- [ ] English version is annotated
- [ ] Variables noted with `{name}` style placeholders
- [ ] Plural forms flagged
- [ ] Faith-language strings flagged for Pastor review
- [ ] Longest-string test passes (no clipping)

---

**Source of truth for IDs:** `ble-46-i18n/locales/id.json`. If the ID isn't there yet, add it (or ask FoundingEngineer to add it) before shipping the design.

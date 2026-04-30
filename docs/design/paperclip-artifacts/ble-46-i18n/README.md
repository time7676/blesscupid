# BLE-46 — Localization Infrastructure

BlessCupid is **Indonesian-first**. Bahasa Indonesia (`id`) is the primary locale; English (`en`) is fallback. v1 ships with both.

## Locale UX rule (BLE-144) — single locale at runtime

Per CEO direction in [BLE-144](/BLE/issues/BLE-144), the app renders **one locale at a time**:

- **No per-screen, per-card, or per-banner language toggles.** No inline `[ID · EN]` pill, no stacked Bahasa+English copy, no "secondary language" rendering anywhere in user-facing UI.
- **Locale switcher lives in `Settings → Language` only.** That is the single surface where the user changes locale; everything else reads from `i18n.resolvedLanguage`.
- **Default locale = `id`.** First paint resolves to device locale if supported; falls back to `id`.
- **Verse content (VOTD, ban-screen blockquote, catechism) follows app locale**: `id` ⇒ TB2/TB; `en` ⇒ NIV. Translation provenance still rendered as `(TB2)` / `(NIV)` parenthetical tag in the reference line.
- **Designer review sheets may keep an `ID/EN` preview toggle** for hi-fi exploration (e.g. catechism review sheet) — those are tooling, never shipped to the app.

Reason: dual-language UI lengthens screens with little payoff and dilutes the single-language reading experience the Pastor wants for faith copy.

## Decisions

| Topic | Choice | Why |
|---|---|---|
| Framework | **`i18next` + `react-i18next` + `expo-localization`** | Best React Native ecosystem support; ICU MessageFormat via `i18next-icu`; runtime locale swap; namespacing; pluralization; cold-start small (~30KB gzipped). |
| Format | JSON, ICU MessageFormat | Standard, tooling-friendly, Crowdin/Lokalise compatible. |
| Default locale | `id` (Bahasa Indonesia) | Founder positioning: Indonesian-first product. |
| Fallback locale | `en` (English) | Coverage during translation gaps; expat users. |
| Locale detection | `expo-localization.getLocales()[0].languageCode`, override stored in `AsyncStorage` key `app:locale` | Respect device, allow user override. |
| Date / time / number | `Intl.DateTimeFormat` / `Intl.NumberFormat` (Hermes 0.74+) with `id-ID` and `en-US` | No extra deps. |
| Currency | `IDR` for both locales (faith-first dating, Indo market). Use `Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR'})`. | |
| Pluralization | i18next CLDR plural rules. Bahasa has `other` only; English `one`/`other`. | |
| Gendered copy | Avoid in design. Bahasa is gender-neutral natively. English alts use neutral phrasing ("their", "this person"). | |
| RTL | Not v1. | Indo / EN both LTR. |
| String IDs | `dot.path` namespaced: `auth.login.cta`, `match.empty.title`. Designers ship Figma with same IDs. | |
| Pastor review | All faith-language strings flagged with key prefix `faith.*` route through Pastor agent before merge. | |

## Files

```
ble-46-i18n/
├── README.md                       # this file
├── i18n.ts                         # runtime setup (drop into Expo/RN app)
├── useLocaleFormatters.ts          # date/number/currency hooks
├── locales/
│   ├── id.json                     # primary (Bahasa)
│   └── en.json                     # fallback (English)
└── docs/
    ├── designer-style-guide.md     # for FoundingDesigner
    ├── translation-workflow.md     # in-house vs vendor, Pastor gate
    └── string-id-conventions.md    # naming + namespacing rules
```

## Acceptance

- [x] Framework chosen + justified
- [x] Default + fallback locales declared
- [x] Locale-switching UX documented
- [x] Pluralization + gender handling documented
- [x] Date/time/number formatting decided
- [x] Designer hand-off contract defined (string IDs + length tokens)
- [x] Translation workflow w/ Pastor faith-review gate
- [x] Sample seed locales (`id.json`, `en.json`) covering auth, match feed, safety, profile, faith

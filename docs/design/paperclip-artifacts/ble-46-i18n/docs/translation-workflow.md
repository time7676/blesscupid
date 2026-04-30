# BlessCupid — Translation Workflow

**Owners:** FoundingEngineer (infra), FoundingDesigner (string extraction), Pastor (faith-language gate).

## Decision: in-house first, vendor only when scale forces it

| Phase | Approach | Why |
|---|---|---|
| **v1 (now → ~2k strings)** | In-house. Bahasa authored by FoundingDesigner; English by FoundingEngineer or AI-assisted (LLM draft → human review). | Founder-team has native Bahasa fluency. Faith register requires judgment a vendor won't have on day one. Cheapest, fastest, highest quality control. |
| **v2 (>2k strings, third locale)** | Move to **Crowdin** or **Lokalise** with in-house reviewer role. Pastor remains the faith-language gate. | Volume + concurrency justify TMS overhead. |

## Source of truth

- `locales/id.json` is the **canonical** source. All copy is authored Bahasa-first.
- `locales/en.json` is the **mirror**. Same key tree, English values.
- Any key present in `id.json` and missing in `en.json` is a CI lint error (and vice versa).

## Authoring loop

```
Designer writes Bahasa in Figma
   ↓
Designer (or LLM-draft) adds English annotation
   ↓
String ID assigned (designer-style-guide §2)
   ↓
Engineer adds key to id.json + en.json
   ↓
faith.* strings → Pastor review (PR comment + approve)
   ↓
Lint: schema parity (id.json keys === en.json keys), ICU validity, length budget
   ↓
Merge → ship
```

## Pastor review gate

- Trigger: PR touches any key under namespace `faith.*` **OR** any key whose value contains a Bible reference, denomination name, or theological term (configurable allow-list in `tools/i18n-lint.ts`).
- Pastor agent gets paged via Paperclip issue interaction `request_confirmation` with the diff.
- Pastor responses become PR comments. Approval = green-checks the gate.
- If Pastor requests changes, the PR is blocked until the diff is updated.

Faith-review heuristics (Pastor agent prompt should include):
- Inclusive across Katolik / Protestan / Kharismatik / Injili / Ortodoks.
- No prosperity-gospel or controversial theology in body copy.
- Bible references use Indonesian standard book abbreviations (e.g. `Yoh 3:16`, not `John 3:16`) in Bahasa locale.
- Tone: pastoral, never preachy.

## Tooling

### Lint script (CI)

```bash
node tools/i18n-lint.js
```

Checks:
1. Key parity: every key in `id.json` exists in `en.json`, and vice versa.
2. ICU MessageFormat validity (parse with `intl-messageformat`).
3. Length budgets per category (CTA, title, body) — warning, not error.
4. No empty values.
5. No untranslated English in `id.json` (heuristic: flag values matching English-only stop words).
6. `faith.*` namespace has Pastor approval label on PR.

### Extraction script

`tools/i18n-extract.ts` walks `apps/mobile/src/**/*.tsx`, finds `t('foo.bar')` calls, and reports keys not present in `id.json`. Wired into pre-commit.

## Adding a new string — 3 steps

1. Add to `locales/id.json` under correct namespace.
2. Add same key to `locales/en.json`.
3. Use in code: `t('namespace.key', { var: value })`.

## Adding a new locale (post-v1)

1. Create `locales/<code>.json` mirroring `id.json` keys.
2. Add `<code>` to `SUPPORTED_LOCALES` in `i18n.ts`.
3. Add `<code>` → BCP-47 mapping in `useLocaleFormatters.ts` (`LOCALE_TAGS`).
4. Test long-string clipping per designer-style-guide §3.

## SLAs

- New string in `id.json` → English mirror added within **48h**.
- Pastor review on `faith.*` → response within **72h**.
- Production string typo → fix + ship within **24h** (no Pastor gate unless faith-language).

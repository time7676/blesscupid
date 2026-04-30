# BLE-54 — Moderation pipeline + admin console

Source of truth: [BLE-31 Report-Triage Doctrine v1.1](../ble-31-report-triage-doctrine.md).

## What's in this directory

| File | Purpose |
|---|---|
| `rules.json` | Rule schema. Six categories + tier matrix, universal escalation triggers (§0), brigade thresholds, edge-case cohorts, appeal config, hard-pause label/enum split. |
| `copy-bundle.json` | Bilingual (`en` + `id`) outbound copy keyed by `(category, action)`. Templates verbatim from BLE-31 §1–§6. Indonesian translations are working drafts pending Pastor + native-speaker review. |
| `pipeline.js` | Rule evaluator. `evaluate(report, ctx)` → `{tier, action, queue, copy, appeal, side_effects, flags, reasoning}`. Browser + Node compatible. |
| `pipeline.test.js` | 19 unit tests. Run `node pipeline.test.js`. |
| `index.html` | Admin console — queue + moderator action UI. |
| `tokens.css` / `console.css` | Aligned to BLE-22 v0.1. No red anywhere on this surface (panic-exit token reserved, never used here). |
| `seed-reports.json` | Fixture set covering every category, brigade, universal triggers, convert-privacy cohort. |

## Run

```
node pipeline.test.js                # 19/19 pass
python3 -m http.server 8080          # then open http://localhost:8080
```

`file://` direct-load is blocked by `fetch()` CORS — must serve via HTTP.

## Acceptance crosswalk

| BLE-54 acceptance criterion | Where it lives |
|---|---|
| All six categories implemented with matrix | `rules.json` → `categories[]` (harassment, sexual, fake, off-platform, financial, doctrinal) |
| Universal escalation triggers wired and tested | `rules.json` → `universal_escalation_triggers[]`; `pipeline.js` → `matchUniversalTrigger`; tests cover minor/self-harm/violence/press |
| Bilingual copy bundle loaded from approved templates | `copy-bundle.json`; integrity test asserts every category × matrix-action has both `en` + `id` |
| Brigade detection unit-tested | `pipeline.js` → `detectBrigade`; 4 brigade tests (positive, single-reporter spam, stale window, target scoping) |
| Convert-privacy masking enforced | `pipeline.js` → `maskCohortTagsForViewer`; viewer-role tests; console banner explains hidden tag |
| Pastor sign-off on console copy before ship | **Pending Pastor** — see [hand-back questions](#hand-back-questions). Indonesian copy is a working draft authored by the engineer, not Pastor-approved. |

## Triage decision flow

```
report
  │
  ├─► universal trigger? (minor / self-harm / violence / press)
  │     ► escalate-CEO, side-effects per trigger, no appeal if legal hold
  │
  ├─► brigade? (≥3 distinct reporters vs same target inside 1h)
  │     ► human-review, suppress auto-actions
  │
  ├─► category + pattern lookup in rules.categories[].matrix
  │     ► tier (auto / human-review / escalate-CEO), action
  │     ► copy from copy-bundle.json[category][action] in {en, id}
  │     ► appeal payload (care@blesscupid.app, 7d) unless non-action / legal hold
  │
  └─► auto-mute on first human-review-confirmed action against target
        (BLE-55 amendment 1 — never on raw report count)
```

## Conventions enforced

- **Tier matrix is data, not code.** Adding a pattern = JSON edit, no JS change.
- **Copy is verbatim.** Moderators select from dropdown; UI does not allow free-form drafting on the action button. Pastor-approved templates only.
- **Internal note** auto-populated with scripture citation + translation tag for the chosen action. Mod-only, never user-visible.
- **`hard-block` enum, "hard pause" label.** Per BLE-31 amendment 2, surface copy says *hard pause*; engineering enum stays `hard-block` for compatibility with BLE-26 + BLE-27.
- **Red is forbidden on this admin console.** Panic-exit red lives in a separate `--state-panic-exit` token that is declared but never applied here. All warning/critical states use amber.
- **Convert-privacy queue masking.** `maskCohortTagsForViewer` strips the `convert-privacy` tag from all viewers except `CEO` and `Pastor`. The default queue view also surfaces a banner explaining a tag was hidden, so moderators know to escalate ambiguous cases without seeing the protected status.

## Hand-back questions (open for Pastor)

1. **ID translations.** Drafted by FoundingEngineer, not native-speaker reviewed. Pastor approval needed before ship — especially the Hebrews 13:5 / James 3:9-10 / Ephesians 4:25 renderings, which use the standard LAI translation but should be sanity-checked against the cohort.
2. **Sob-story financial warning template.** BLE-31 §5 lists sob-story-soft-money-ask as `human-review` but doesn't author warning copy; I drafted one inline (`copy-bundle.json` → `financial.warning`). Pastor: keep, rewrite, or delete and route only to removal?
3. **Off-platform ban template.** §4 says "see Financial section" — I added a stub that points moderators to the financial-ban template. Confirm that's the intended UX (i.e., moderator picks `financial.ban` instead of `off-platform.ban`)?
4. **Edge-case cohort tags.** I implemented `divorced`, `bereaved`, `deconstruction`, `convert-privacy` per the issue scope. Are these the canonical four for v1, or does Pastor want others (e.g., `singles-ministry`, `seminary-student`, `mixed-faith-marriage-survivor`)?
5. **Auto-mute duration.** Set to 24h pending product call. BLE-55 §1 specifies the trigger but not the duration.

## Hand-back to BLE-31

Comment template (paste into BLE-31 thread):

> BLE-54 implementation landed in `ble-54-moderation-pipeline/` (sibling dir to this doc). Admin console route on local: `http://localhost:8080/`. All six categories matrixed, universal triggers wired (minor/self-harm/violence/press/brigade), brigade detection unit-tested (3+ distinct reporters in 1h → suppress auto + route human-review), convert-privacy masked outside CEO + Pastor, bilingual `en`+`id` copy verbatim from §1–§6. Five rule-tuning questions for Pastor in the README → "Hand-back questions". Pastor sign-off on Indonesian translations pending before ship.

---
fixture: true
---

# Fixtures — DO NOT SHIP

Files in this directory are intentional lint violations used by
`apps/mobile/scripts/lint-moderation-copy.test.mjs`. The lint excludes this
directory by default; tests opt in via `--include-fixtures`.

Each fixture targets one rule from BLE-42 Playbook Appendix B:

- `banned-phrase-violation.md` — banned-phrase regex match (T1)
- `missing-rule-id.md` — T2 template without `{{rule_id}}`
- `missing-appeal-url.md` — T3 template without `{{appeal_url}}`
- `freshness-warn.md` — `pastor_reviewed_at` 35 days old (warn)
- `freshness-fail.md` — `pastor_reviewed_at` 70 days old (fail)
- `clean-t3.md` — passes everything (regression check)

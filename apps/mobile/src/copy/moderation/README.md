---
pastor_reviewed_at: 2026-04-28
not_a_template: true
---

# Moderation copy templates

Pastor-owned. Engineer wires interpolation. Build-time lint at
`apps/mobile/scripts/lint-moderation-copy.mjs` enforces:

1. No banned phrase from [BLE-42 Playbook Appendix B](/BLE/issues/BLE-42#document-moderation-playbook).
2. T2+ templates contain `{{rule_id}}`.
3. T3+ templates additionally contain `{{appeal_url}}`.
4. Frontmatter `pastor_reviewed_at: YYYY-MM-DD` not stale (warn >30d, fail >60d).

## Frontmatter contract

```yaml
tier: t1 | t2 | t3 | t4
rule_id: HCoC-X.Y           # optional metadata; not the runtime token
pastor_reviewed_at: YYYY-MM-DD
```

The runtime tokens `{{rule_id}}` and `{{appeal_url}}` are interpolated by the
mobile client at render time from the moderation action payload (see Playbook
Appendix A.2 audit log fields).

## Adding a template

1. Drop a `.md` file in this directory with the frontmatter above.
2. Compose the body using only Pastor-approved phrasing from Playbook §4.
3. Run `pnpm --filter @blesscupid/mobile run lint:moderation-copy` locally
   before pushing.
4. Update `pastor_reviewed_at` whenever Pastor re-reviews the wording.

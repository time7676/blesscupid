# BLE-45 — Photo Moderation ML Pipeline Spec

**Owners:** FoundingEngineer (lead), Pastor (rules), FoundingDesigner (UX states)
**Status:** Draft v1 — pending Pastor + Designer review
**Date:** 2026-04-28
**Related:** BLE-26 (chat banner pattern), BLE-27 (safety center), BLE-28 (Pastor rule book), BLE-31 (report triage doctrine)

---

## 1. Goals & Non-Goals

### Goals
- Block sexually explicit, violent, and weapon imagery before it reaches any user.
- Enforce *pre-marriage modesty* tuning (stricter than general dating apps).
- Detect AI-generated / catfish faces.
- Provide pastoral, redemptive rejection UX (not punitive).
- Hard SLA: critical-queue review ≤ 24h.
- Audit trail sufficient for regulator + church-board defense.

### Non-Goals
- Video moderation (deferred — photos only at v1).
- Live-stream moderation.
- Profile bio text moderation (covered by BLE-26 chat moderation pipeline).
- ID/KYC verification (separate workstream).

---

## 2. ML Provider Decision

### Comparison matrix

| Provider | Latency p50 | Cost / 1k images | Accuracy (NSFW) | Custom categories | AI-face detect | Notes |
|---|---|---|---|---|---|---|
| **Hive Moderation** | 350 ms | $1.50 | 98.5% | Yes (40+ classes) | Yes (built-in) | Industry leader for dating apps. Tinder/Bumble use it. |
| AWS Rekognition | 600 ms | $1.00 | 94% | Limited | No | Cheap, lower recall on suggestive. |
| Google Vision SafeSearch | 400 ms | $1.50 | 92% | No (5 fixed buckets) | No | Coarse buckets only (adult/violence/medical/spoof/racy). |
| OS (NSFW.js / Falconsai) | 80 ms (GPU) | ~$0.10 amortized | 88–90% | Self-train | No | Cheap but ops burden + accuracy gap. |

### Decision: **Hive Moderation (primary) + OS pre-filter (cost guard)**

**Rationale:**
- Hive ships dedicated `suggestive`, `gun`, `alcohol`, `cigarette`, `drugs`, `gambling`, `religious-symbol` classes out of the box — directly maps to BLE-28 rule book.
- AI-generated face detection ships native (DeepFake class). Critical for catfish defense.
- Single vendor reduces cross-provider score reconciliation logic.
- Cost manageable at expected v1 volume (~50k uploads/month → $75/mo).

**Cost-guard pre-filter (OS):** Run NSFW.js (open-source MobileNet) **client-side in the upload widget** to reject obvious explicit content before it ever hits the server or Hive. Cuts Hive cost ~30–40% (estimate from Hive case study). Falls open if model fails to load — server-side Hive is the real gate.

**Vendor lock mitigation:** Wrap Hive behind `ModerationProvider` interface. Swap-friendly. Re-evaluate annually.

---

## 3. Categories Detected & Thresholds

### Category list (ingested from BLE-28 rule book)

| # | Category | Hive class(es) | Auto-block ≥ | Human-review band | Auto-pass < |
|---|---|---|---|---|---|
| 1 | Nudity (full/partial) | `general_nsfw`, `general_suggestive` (nude subclass) | 0.85 | 0.60–0.85 | 0.60 |
| 2 | Suggestive / immodest | `general_suggestive`, custom `swimwear`, `lingerie` | 0.75 | 0.50–0.75 | 0.50 |
| 3 | Weapons | `gun_in_hand`, `gun_not_in_hand`, `knife_in_hand` | 0.80 | 0.55–0.80 | 0.55 |
| 4 | Alcohol-prominent | `alcohol`, `drinking` | 0.75 (foreground only) | 0.55–0.75 | 0.55 |
| 5 | Smoking / drugs | `smoking`, `illicit_drug_use` | 0.75 | 0.55–0.75 | 0.55 |
| 6 | Violence / gore | `gory`, `corpse`, `physical_violence` | 0.70 | 0.50–0.70 | 0.50 |
| 7 | Hate symbols | `nazi`, `confederate`, `terrorist`, `kkk` | 0.60 (any positive) | n/a — auto-block all positive | — |
| 8 | AI-generated face | `deepfake`, `gan_generated` | 0.85 | 0.65–0.85 | 0.65 |
| 9 | Minors in romantic context | `minor` + face attribute < 18 | **any positive → auto-block + flag legal** | n/a | — |
| 10 | Religious context (positive signal) | `religious_symbol` (cross, hijab, kippah) | n/a — *informational only*, never blocks | n/a | n/a |

### Pre-marriage / dating-context tuning

- **Modesty bias:** suggestive threshold dropped from Hive default (0.85) to **0.75** auto-block. Reflects BLE-28 rule "no swimwear, no lingerie, no shirtless gym selfies even if non-sexual."
- **Alcohol nuance:** glass-of-wine-at-dinner ≠ shotgunning beer. Use `alcohol_prominence_ratio` (Hive subscore) — only block when alcohol occupies >25% frame OR subject is visibly intoxicated (`intoxicated` subclass ≥ 0.6).
- **Religious symbol whitelist:** elevates *trust* signal in audit log. Never used for negative action — surfaced to pastor-review queue as positive context.
- **Modesty calibration set:** Pastor curates 500 hand-labeled images quarterly (modest / borderline / immodest) → recalibrate thresholds. Owned by Pastor agent under BLE-28.

### Block 9 (minors): zero-tolerance hard stop

Any positive minor classification on a romantic-context photo → **auto-block, account freeze, legal escalation, NCMEC report if confirmed CSAM**. No human-review band. No appeal path through normal queue. Routes to dedicated trust-and-safety channel.

---

## 4. Pipeline Architecture

```
[Client upload widget]
      │
      │  1. Client pre-filter (NSFW.js MobileNet, ~80ms)
      │     → reject obvious explicit before upload
      │
      ▼
[Photo upload API: POST /photos]
      │
      │  2. Store original to S3 (encrypted, private bucket)
      │  3. Generate moderation_job, status=pending
      │  4. Enqueue → SQS moderation queue
      │
      ▼
[Moderation worker]
      │
      │  5. Fetch image, call Hive /sync endpoint
      │  6. Apply threshold matrix (§3)
      │  7. Decision: AUTO_BLOCK | HUMAN_REVIEW | AUTO_APPROVE
      │  8. Persist ModerationDecision row + raw Hive payload
      │
      ├─── AUTO_APPROVE ──→ photo.status = visible
      │
      ├─── AUTO_BLOCK   ──→ photo.status = blocked
      │                     fire user notification (pastoral copy, §6)
      │                     emit audit_event(moderation.auto_block)
      │
      └─── HUMAN_REVIEW ──→ photo.status = pending_review
                            insert into review_queue (priority by category)
                            user sees "Under review" banner (§6)
                            ▼
                       [Human reviewer dashboard]
                            │
                            │  reviewer decides → approve / reject / escalate
                            │  SLA: 24h critical (nudity, weapons, minors-suspect)
                            │       72h non-critical (alcohol, suggestive borderline)
                            ▼
                       [Decision applied + user notified]
```

### Latency budget
- Client pre-filter: 80 ms (P50, on-device)
- S3 upload: 400 ms (P50, 2MB image)
- Hive call: 350 ms (P50)
- Total user-perceived "submitting → result" for auto-decisions: **~900 ms p50, 2.5s p95.**
- Human-review path: instant "Under review" banner; resolution ≤ 24h critical.

### Failure modes
- **Hive timeout/5xx:** retry 2× w/ jitter, then route to `HUMAN_REVIEW` (fail-closed). Never auto-approve on provider failure.
- **Queue backlog > 500:** PagerDuty critical to FoundingEngineer + on-call.
- **Pre-filter model fails to load client-side:** silent fallback — server is real gate.

---

## 5. Auto-Block vs Human-Review Threshold (Decision Doctrine)

### When auto-block is correct
- High-confidence (≥ category threshold in §3) on a clearly-defined class.
- Hate symbols (any positive).
- Minors in romantic context (any positive).
- User-provided photo metadata flags (e.g. EXIF "AI generated" tag).

### When human-review is correct
- Score in mid-band (see §3 matrix).
- Multi-class hits where each is below threshold but cumulative concern (e.g. alcohol 0.7 + suggestive 0.7 + intoxicated 0.5).
- Religious symbol present + suggestive signal (review by Pastor — sensitivity required).
- Re-upload after rejection (always at least light human review — prevents threshold-poking attack).
- New-user first photo (lower bar to review for first-photo defense against catfish).

### When auto-approve is correct
- All scores below review band in §3.
- No new-user / re-upload context flag.
- No EXIF/provenance flag.

### Doctrine: fail-closed, not fail-open
> Better to over-route to human review than to leak. Reviewer SLA is the relief valve, not the threshold itself. If review backlog grows, the answer is **more reviewers**, not **looser thresholds**.

---

## 6. User-Facing Moderation States (UX)

Extends BLE-26 chat banner pattern. Owned in detail by FoundingDesigner — handoff in §10. State enum:

| State | Banner | Tone | User action |
|---|---|---|---|
| `pending_review` | "We're taking a closer look at this photo. It'll be visible once approved — usually within 24h." | Reassuring, not accusatory | Wait. Can replace photo. |
| `auto_blocked_modesty` | "This photo doesn't fit BlessCupid's photo guidelines. We hold ourselves to a stricter standard than other apps — that's part of the covenant we ask of every member." | Pastoral, redemptive | Re-upload (CTA: "Choose another") + link to guidelines. |
| `auto_blocked_safety` | "This photo can't be shown — it includes content we don't allow on BlessCupid (weapons / violence / hate symbols)." | Firm, no shame | Re-upload. |
| `human_rejected` | "A reviewer looked at this photo and we can't show it. Reason: [category-specific copy]. You can pick a different photo anytime." | Personal but firm | Re-upload. Appeal link only for ambiguous categories. |
| `appeal_submitted` | "Thanks — a pastor on our team will look at this photo within 48h." | Honored | Wait. |
| `legal_hold` | (no banner — silent block) | n/a — minors / CSAM path is silent + escalated | n/a |

### Pastoral copy principles (drafted with Pastor)
- Never shame. Frame as covenant, not punishment.
- Always offer a path forward ("choose another", "talk to a pastor").
- Never publicly disclose rejection — only the user sees the state.
- For modesty rejections, link to the photo guidelines page (BLE-28 deliverable) — not a generic ToS.
- For safety rejections (weapons/violence), be matter-of-fact. No theology lecture.
- Never expose Hive class names or scores to users. Translate to human language.

### Re-upload flow
1. User taps "Choose another" CTA.
2. Inline guidance card surfaces above photo picker: 3 example "good photos" (faces visible, full clothing, no weapons, no alcohol-forward) + 3 anti-examples (blurred).
3. Photo picker opens — flow continues.
4. New upload re-runs full pipeline. **Re-upload context flag** lowers review thresholds (per §5).

---

## 7. Audit Logging

### Schema: `moderation_decisions`
```sql
CREATE TABLE moderation_decisions (
  id              UUID PRIMARY KEY,
  photo_id        UUID NOT NULL REFERENCES photos(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  decision        TEXT NOT NULL CHECK (decision IN ('auto_approve','auto_block','human_review','human_approve','human_reject','escalated','legal_hold')),
  category        TEXT,                 -- which category triggered
  scores          JSONB NOT NULL,       -- raw Hive payload
  threshold_set   TEXT NOT NULL,        -- version of threshold matrix used
  rule_book_rev   TEXT NOT NULL,        -- BLE-28 rule book revision SHA
  reviewer_id     UUID,                 -- null for auto
  reviewer_notes  TEXT,
  user_notified   BOOLEAN NOT NULL DEFAULT false,
  appeal_state    TEXT,
  context_flags   JSONB,                -- {first_upload, re_upload, religious_signal, etc}
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at     TIMESTAMPTZ
);

CREATE INDEX idx_mod_decisions_user ON moderation_decisions(user_id, created_at DESC);
CREATE INDEX idx_mod_decisions_queue ON moderation_decisions(decision, created_at) WHERE decision = 'human_review';
```

### Retention
- Decision rows: **5 years** (regulator + dispute defense).
- Raw image (in S3 cold storage if blocked): **90 days** then purge unless legal-hold flag.
- CSAM-suspected: legal-hold path; do not purge; chain-of-custody log.
- Reviewer audit trail (who reviewed what, when): immutable append-only log, exported nightly to off-site bucket.

### Reviewer accountability
- Every human decision logs reviewer_id, decision_time, time_on_decision.
- Quarterly sample of 200 decisions per reviewer → second-pass review. Drift > 10% → recalibration training.

### Privacy
- Audit access scoped to: legal, FoundingEngineer, Pastor (rules audit only — sees scores + categories, not raw images of rejected users).
- All access logged.

---

## 8. Human-Review Queue & SLA

### Queue priorities

| Priority | Category triggers | SLA (review-to-decision) |
|---|---|---|
| P0 (page on-call) | Suspected minor; CSAM-flag; mass-upload abuse pattern | **immediate** |
| P1 (critical) | Nudity (review band), weapons, deepfake suspected, hate-symbol borderline | **24h** |
| P2 (standard) | Suggestive borderline, alcohol-prominent borderline | **72h** |
| P3 (low) | First-upload defense review, religious-signal review | **5 days** |

### Staffing model (v1, soft-launch)
- 2 part-time reviewers (Indonesian team, EN+ID fluent), 4h/day each = 8h coverage spanning APAC + EU windows.
- Pastor reviews all P3 religious-signal queue + 10% sample of all P1 modesty rejections (calibration).
- v2 scales with user growth (target: 1 reviewer per 5k DAU).

### Reviewer dashboard requirements (handoff to ticket BLE-45-T6)
- Image + scores + category + user history (priors? new account?).
- One-click decisions: Approve / Reject / Escalate-to-Pastor / Escalate-to-Legal.
- Reason taglist (drives user-facing copy).
- Keyboard shortcuts. Average decision: ≤ 15 seconds.

---

## 9. Open Questions (Pastor + Designer)

1. **Pastor — modesty calibration set:** Need 500-image golden set by 2026-05-15 to lock thresholds. Will Pastor curate or do we hire labelers? *(Owner: Pastor)*
2. **Pastor — alcohol nuance:** Confirm "wine at dinner ≠ block, beer-pong ≠ allow" framing. Need explicit examples in BLE-28 rule book. *(Owner: Pastor)*
3. **Designer — modesty rejection copy:** Need 3 finalist copy variants for `auto_blocked_modesty` banner. Test in usability session. *(Owner: FoundingDesigner)*
4. **Designer — re-upload guidance card:** 3 good + 3 anti-example photos. *(Owner: FoundingDesigner)*
5. **Engineering — appeal path:** Two-tier (light review + pastor review) or single-tier? Recommend two-tier for cost. *(Owner: FoundingEngineer)*
6. **Cross-team — Indonesian context:** hijab, kebaya, traditional dress — need explicit allow-list to avoid false positives on cultural attire. *(Owner: Pastor + Designer)*

---

## 10. Implementation Ticket Breakdown

Following tickets to be filed as BLE-45 children. Sized for ≤ 1 week per ticket where possible.

| Ticket | Title | Owner | Priority | Est. | Depends on |
|---|---|---|---|---|---|
| BLE-45-T1 | Photo upload API + S3 storage + moderation_job model | FoundingEngineer | P1 | 3d | — |
| BLE-45-T2 | Hive Moderation provider integration (`ModerationProvider` iface + Hive impl) | FoundingEngineer | P1 | 3d | T1 |
| BLE-45-T3 | Threshold matrix + decision engine | FoundingEngineer | P1 | 2d | T2 |
| BLE-45-T4 | Client-side NSFW.js pre-filter in upload widget | FoundingEngineer | P2 | 2d | T1 |
| BLE-45-T5 | moderation_decisions audit table + retention jobs | FoundingEngineer | P1 | 2d | T1 |
| BLE-45-T6 | Reviewer dashboard (internal) | FoundingEngineer + Designer | P1 | 5d | T3, T5 |
| BLE-45-T7 | User-facing moderation state banners (extends BLE-26) | FoundingDesigner + FoundingEngineer | P1 | 3d | T3 |
| BLE-45-T8 | Re-upload flow + guidance card | FoundingDesigner + FoundingEngineer | P2 | 3d | T7 |
| BLE-45-T9 | Modesty calibration golden set + threshold tuning script | Pastor + FoundingEngineer | P1 | 4d | T2 |
| BLE-45-T10 | CSAM/minor escalation path + legal_hold pipeline | FoundingEngineer + Legal | P0 | 4d | T5 |
| BLE-45-T11 | Reviewer SLA monitoring + on-call alerts | FoundingEngineer | P2 | 2d | T6 |
| BLE-45-T12 | Pastoral copy review for all moderation states | Pastor + FoundingDesigner | P1 | 2d | T7 |

**Total est. eng effort:** ~35 dev-days FoundingEngineer + ~15 designer-days + ~10 Pastor-days. Soft-launchable in ~6 weeks with parallel work.

---

## 11. Decisions Locked / Decisions Pending Review

### Locked (this doc)
- Hive Moderation as primary ML provider.
- NSFW.js client pre-filter as cost guard.
- Threshold matrix in §3 — pending Pastor recalibration via T9.
- Fail-closed doctrine — never auto-approve on provider failure.
- 5-year audit retention.
- 24h P1 SLA.

### Pending (review needed before T2 build)
- Final pastoral copy variants (T12).
- Indonesian cultural attire allow-list (open Q #6).
- Appeal flow tier count.

---

**Next action:** Submit this doc for review. File child tickets T1–T12. Request Pastor + Designer feedback via comments on BLE-45.

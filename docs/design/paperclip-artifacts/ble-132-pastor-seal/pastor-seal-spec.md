# BLE-132 — Pastor-mode 24h transcript seal on revoke (server spec)

**Companion to** `pastor-seal-hifi.html`. The hi-fi is the visible half; this is the server contract.
**Doctrine:** Wahyu 3:20 (Christ withdraws when the door is closed). The mentor must withdraw as completely.
**v1 posture:** soft-seal at T+24h, hard-delete at T+90d unless legal hold. Asymmetric — pastor loses access; audited user keeps her mirror permanently.

---

## 1. State machine

`pastor_relationship.state`

```
invited → accepted → walking → revoked → sealed → hard_deleted
                                  ↑          ↑
                     (user action)│          │ (cron, T+90d)
                                  │          │
                  pastor cannot   │  pastor 403 on transcripts;
                  read transcripts│  journal accessible
                  yet (instant)   │
```

Transitions:

| From | To | Trigger | Latency budget |
|------|------|---------|----------------|
| `walking` | `revoked` | User confirms "Ya, akhiri" (BLE-108 surface 5a) | synchronous |
| `revoked` | `sealed` | Hourly seal job, when `revoked_at ≤ now − 24h` | ≤ 24h |
| `sealed` | `hard_deleted` | Daily delete job, when `sealed_at ≤ now − 90d` AND `legal_hold = false` | best-effort same day |
| any | `legal_hold = true` | Compliance/admin action | synchronous; freezes in current state |

Once `revoked`, the pastor's transcript-read API does **not** return rows even before the seal job runs — see §3 below. The 24h is an upper bound for the *visible* state transition (sidebar UI flip), not for access loss.

> **Why a 24h delay on the visible flip and not instantaneous?**
> Two reasons. (a) Anti-spite: a Pastor who revokes-on-impulse via the user's account would get an immediate UI shock; the soft window prevents accidental revocations from being weaponised within an emotional minute. (b) Auditability: gives the seal job a window to run, log every transition, and surface anomalies before they become 403 mysteries. Access loss is instant, but the *empty state* is gentle.

---

## 2. Schema

Two tables touched. **No `pastor_notes` deletion** anywhere in this spec — pastor's notes are HIS data.

```sql
ALTER TABLE pastor_relationship
  ADD COLUMN revoked_at      timestamptz,
  ADD COLUMN sealed_at       timestamptz,
  ADD COLUMN hard_deleted_at timestamptz,
  ADD COLUMN legal_hold      boolean NOT NULL DEFAULT false,
  ADD COLUMN seal_audit_id   text;  -- A8F2-YYYY-MM-DD-HH-MM, surfaced on 403

ALTER TABLE pastor_notes
  ADD COLUMN audited_user_snapshot jsonb;  -- {display_name, avatar_color, walked_for_days}
  -- audited_user_id is kept for legal hold restoration but ignored by journal queries
  -- once the parent relationship is sealed.
```

Indexes:

```sql
CREATE INDEX pastor_relationship_seal_due
  ON pastor_relationship (revoked_at)
  WHERE state = 'revoked';

CREATE INDEX pastor_relationship_delete_due
  ON pastor_relationship (sealed_at)
  WHERE state = 'sealed' AND legal_hold = false;
```

---

## 3. Access enforcement (the 403)

Single guard at the transcript-read route. **Do not rely on UI hiding.**

```ts
// server/routes/walking-with/transcripts.ts
async function readTranscript(req, res) {
  const { relationshipId, threadId } = req.params;
  const rel = await db.pastorRelationship.findById(relationshipId);

  if (!rel || rel.pastorId !== req.user.id) return res.sendStatus(404);

  if (rel.state === 'revoked' || rel.state === 'sealed' || rel.state === 'hard_deleted') {
    auditLog.write({
      kind: 'transcript_seal_403',
      pastorId: req.user.id,
      relationshipId,
      threadId,
      at: new Date(),
      sealAuditId: rel.sealAuditId,
    });

    return res.status(403).json({
      error: 'transcript_sealed',
      sealedAt: rel.sealedAt ?? rel.revokedAt,
      sealAuditId: rel.sealAuditId,
      // Body string is rendered client-side from SEAL.HERO.BODY.403 — server returns code, not copy.
    });
  }

  // …normal read path…
}
```

Notes:

- **403, not 404.** A 404 would imply the resource never existed and would let a Pastor probe whether revoke happened. 403 is the honest answer: "this used to be yours to read; now it isn't."
- **`relationshipId` is checked before state.** A Pastor probing a stranger's relationship still gets 404, not 403.
- **Audit log every 403.** Probing-rate metrics surface obsessive Pastors to the moderation queue.
- **`sealAuditId` returned in body** so support tickets can resolve to the exact seal event.

---

## 4. Seal job (T + 24h)

```ts
// jobs/sealRevokedRelationships.ts — runs every hour, idempotent.
async function sealRevokedRelationships(now = new Date()) {
  const cutoff = subHours(now, 24);

  const due = await db.pastorRelationship.findAll({
    where: { state: 'revoked', revokedAt: { lte: cutoff } },
    limit: 500,  // batch to keep one tick fast
  });

  for (const rel of due) {
    await db.transaction(async (tx) => {
      const sealAuditId = generateSealAuditId(now);  // A8F2-2026-04-29-09-47

      await tx.pastorRelationship.update(rel.id, {
        state: 'sealed',
        sealedAt: now,
        sealAuditId,
      });

      // Snapshot the audited user into pastor_notes so journal queries
      // do not need to JOIN past the sealed boundary.
      await tx.pastorNotes.updateWhere(
        { relationshipId: rel.id, auditedUserSnapshot: null },
        {
          auditedUserSnapshot: {
            display_name: rel.auditedUser.displayName,
            avatar_color: rel.auditedUser.avatarColor,
            walked_for_days: differenceInDays(rel.revokedAt, rel.acceptedAt),
          },
        },
      );

      auditLog.write({ kind: 'relationship_sealed', relationshipId: rel.id, sealAuditId, at: now });
    });
  }
}
```

Idempotency: only picks up `state = 'revoked'`. A row already `sealed` is skipped.
Failure mode: re-runs the next hour. The 24h is an upper bound, not a guarantee of exactly-24h.

---

## 5. Journal query (what surface 8c reads)

```ts
async function getPastorJournals(pastorId: string) {
  return db.pastorRelationship.findAll({
    where: { pastorId, state: { in: ['sealed', 'hard_deleted'] } },
    include: {
      notes: {
        select: ['id', 'body', 'createdAt', 'auditedUserSnapshot', 'wasWrittenWithinHoursOfRevoke'],
      },
    },
    orderBy: { sealedAt: 'desc' },
  });
}
```

The journal page reads from `pastor_notes` joined back to its (sealed) parent — but only fields that survived the snapshot. **The transcript table is never queried from this surface.** Pastors literally cannot reach Maya's messages from the journal page; the JOIN does not exist in the resolver.

The provenance tag `JOURNAL.ENTRY.PROVENANCE.CLOSE` is computed at query time:

```ts
const isCloseDay = (note, rel) =>
  Math.abs(differenceInHours(note.createdAt, rel.revokedAt)) <= 12;
```

---

## 6. Hard-delete job (T + 90d)

```ts
// jobs/hardDeleteSealedRelationships.ts — runs daily, 03:00 WIB.
async function hardDeleteSealedRelationships(now = new Date()) {
  const cutoff = subDays(now, 90);

  const due = await db.pastorRelationship.findAll({
    where: {
      state: 'sealed',
      sealedAt: { lte: cutoff },
      legalHold: false,
    },
    limit: 100,
  });

  for (const rel of due) {
    await db.transaction(async (tx) => {
      // Delete transcript-side data only. Pastor notes are untouched.
      await tx.transcriptMessage.deleteWhere({ relationshipId: rel.id });
      await tx.transcriptReadReceipt.deleteWhere({ relationshipId: rel.id });
      await tx.transcriptAttachment.deleteWhere({ relationshipId: rel.id });

      await tx.pastorRelationship.update(rel.id, {
        state: 'hard_deleted',
        hardDeletedAt: now,
      });

      auditLog.write({
        kind: 'relationship_hard_deleted',
        relationshipId: rel.id,
        sealAuditId: rel.sealAuditId,
        at: now,
      });
    });
  }
}
```

**Legal hold flag:**

- Set by an admin via a compliance route (out of scope for v1 UI; expose via internal admin tooling only).
- Once true, both seal-job and hard-delete-job skip the row. The relationship still transitions to `sealed` if `legal_hold` is set after `revoked`, but never to `hard_deleted`.
- Clearing `legal_hold` resumes the cron's eligibility on the next run.

**Audited user's mirror:**

- Lives in `audited_user_pastor_views` (user-side schema).
- These cron jobs **never touch that table**. Maya's record of what was read is hers, permanently.
- v2 may add a user-initiated "delete my mirror" action — out of scope for BLE-132.

---

## 7. Notification on revoke (gentle)

When user revokes (state → `revoked`), Pastor gets a single in-app notice. **No push notification** — the news is the user's, and it should not chase the Pastor with a buzz.

```
Title: Maya P. memilih untuk berjalan sendiri
Body: Perjalanan kalian sudah selesai. Catatan Anda untuk Maya tersimpan di jurnal Anda.
Tap: → /walking-with (sealed entry visible immediately, even before T+24h flip)
```

Pastor copy review pending — see `pastor-seal-hifi.html#copy` for the canonical string list including this notice (string IDs to be added on first review pass).

---

## 8. Tests (smallest set that proves correctness)

Per the agent contract, smallest-set-for-confidence on safety-critical paths:

1. **`seal_job_flips_state_after_24h`** — insert a `revoked` row with `revoked_at = now - 25h`, run job, expect `sealed`, `sealed_at` set, `seal_audit_id` set.
2. **`seal_job_skips_under_24h`** — `revoked_at = now - 1h`, run job, expect still `revoked`.
3. **`seal_job_idempotent`** — already `sealed` row, run job twice, expect no double-write, no audit log entry the second time.
4. **`transcript_read_returns_403_when_sealed`** — Pastor with sealed relationship hits transcript route, expect 403 with `sealAuditId`.
5. **`transcript_read_returns_403_when_revoked_before_seal_job`** — same as above but state = `revoked` (proves access loss is instant).
6. **`transcript_read_returns_404_when_not_pastor`** — different Pastor's id, expect 404 (no probing leak).
7. **`pastor_notes_survive_seal`** — insert relationship + 3 notes, revoke, run seal job, expect notes still present with `audited_user_snapshot` populated.
8. **`hard_delete_job_drops_transcripts_only`** — `sealed_at = now - 91d`, `legal_hold = false`, run job, expect transcript rows gone, pastor notes intact, audited_user_pastor_views (mirror) intact.
9. **`hard_delete_job_skips_legal_hold`** — same but `legal_hold = true`, expect transcript rows still present.
10. **`audit_log_403_writes_on_each_attempt`** — Pastor probes sealed transcript 5 times, expect 5 audit log entries (so probing-rate metric works).

That's it. No coverage padding.

---

## 9. Out of scope (hand-off list)

- GDPR / UU PDP right-to-be-forgotten for the audited user's full account — separate ticket.
- Custom hard-delete schedule per pastor or per diocese — v2.
- Audited-user-initiated deletion of her own mirror — v2.
- Pastor admin-tool to manually trigger early seal — not yet established as needed.
- Cross-region replication of audit logs — infra-level, separate epic.

---

## 10. Open questions for Pastor + CEO

1. **Notification copy** — single in-app notice on revoke. Is "Maya P. memilih untuk berjalan sendiri" the right register, or should it be more reflective ("Perjalanan Anda dengan Maya sudah selesai")? See string IDs to be added under §Copy in the hi-fi page on first Pastor pass.
2. **Wahyu 3:20 framing** — using "Christ knocks; when the door closes, He withdraws" as the doctrinal license for mentor withdrawal. Alternative readings exist (e.g., reading 3:20 as ongoing knocking even after closure). Pastor's call.
3. **Asymmetric retention** — confirming this is doctrinal default rather than a v2 add-on. CEO consult.
4. **90 days** — chosen to match a typical legal/audit retention floor without becoming archival. Pastor: comfortable with this number, or should the default be shorter (30d) for the pastoral frame?

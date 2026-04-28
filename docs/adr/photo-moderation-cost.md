# Photo moderation cost estimate (BLE-7d)

## AWS region + bucket

- Region: `ap-northeast-1` (Tokyo) — colocates with anticipated Japanese launch
  market, lowest user-perceived upload latency.
- Bucket: `blesscupid-photos-dev` for dev; `blesscupid-photos-prod` for prod.
- Awaiting CEO confirmation. Defaults reflected in `apps/api/.env.example`.

## Per-photo cost (Tokyo, 2026 list price)

| Item | Unit price | Per finalize call |
|------|------------|-------------------|
| `Rekognition DetectFaces` (first 1M images) | $1.00 / 1k | $0.001 |
| `Rekognition DetectModerationLabels` | $1.00 / 1k | $0.001 |
| `S3 PUT` | $0.0047 / 1k | $0.0000047 |
| `S3 storage` (Standard, ~250KB avg) | $0.025 / GB-month | $0.0000063 / mo |
| `S3 GET` (profile views, ~30/mo/photo) | $0.00037 / 1k | $0.000011 / mo |

**Per signup (1 photo):** ~$0.002 moderation + negligible storage.

## Monthly forecast

| Stage | Active users | Monthly photo cost |
|-------|--------------|--------------------|
| Closed beta | 500 | <$1 |
| Public beta | 5,000 | ~$10 |
| 50k MAU | 50,000 | ~$100 |

Photo costs are **dwarfed by OpenAI text moderation** — the constraint is
text classification on chat messages, not images.

## Hard rules implemented in code

- `multiple_faces` ⇒ reject (privacy + identity).
- `Explicit Nudity` / `Suggestive` parent labels ⇒ block (no nudity ever passes).
- `Violence` parent labels ⇒ block.
- `face_too_small` (<8% bbox area) ⇒ reject (catches body-only photos).
- `low_confidence` (<90%) ⇒ reject.
- All other unsafe-label detections fall through to `block` decision; the
  finalize endpoint writes a `ModerationItem` row + returns `photo_rejected`.

## Open questions for CEO

- [ ] Confirm region `ap-northeast-1` vs `ap-southeast-1` (Singapore — cheaper egress).
- [ ] Bucket naming convention `blesscupid-photos-{env}` vs per-tenant prefix.
- [ ] Profile photo CDN (CloudFront) — defer until BLE-8 viewing surface ships.

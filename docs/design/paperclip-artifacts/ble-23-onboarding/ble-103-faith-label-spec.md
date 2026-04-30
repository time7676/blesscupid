# BLE-103 — Faith profile label spec (engineering hand-off)

Pastor-flagged label corrections + 1 inclusion fix on faith-first profile fields. Source review: BLE-87. Wireframe location: `ble-23-onboarding/lookbook.html` (Screen 06 — Profil iman, Screen 07a — Marriage timeline).

## 1. Pelayanan section (Screen 06)

- Section header: **"Pelayanan (opsional)"** (was "Spiritual gifts").
- EN fallback: "Areas of serving (optional)".
- Helper text below header: *"Area pelayananmu di gereja. Bisa pilih lebih dari satu."* / EN: "Where you serve at church. Pick as many as apply."
- Chip set (multi-select, order preserved):
  1. Pujian / Worship
  2. Pemuda / Youth
  3. Doa / Prayer
  4. Pengajaran / Teaching
  5. Misi / Missions
  6. Anak / Children
  7. Diakonia / Diakonia
  8. Konseling / Counseling
  9. Lainnya / Other
- Field is **optional**. No required asterisk. No min-select.
- Doctrinal reasoning: chips name *ministry/serving areas* (Pelayanan), not Romans 12 / 1 Cor 12 spiritual gifts. "Pelayanan" is the cross-tradition term that does not pick a fight with Pentecostal/charismatic users (~25M+, GBI/COOL/Bethel networks).

## 2. Denomination field (Screen 06)

- Label: **"Denominasi (opsional)"** — required asterisk removed.
- Helper text: *"Belum yakin? Tidak apa — kamu bisa lewati atau pilih 'Belum yakin / Masih mencari' di bawah daftar."* / EN: "Not sure? That's okay — you can skip this or pick 'Still discerning / exploring' at the bottom of the list."
- Dropdown options (order preserved, new option appended last):
  1. Katolik
  2. Protestan
  3. Kharismatik
  4. Injili
  5. Ortodoks
  6. Lainnya
  7. **Belum yakin / Masih mencari** *(new — never auto-selected)*
- **Mode-conditional required state**: optional in friendship + community modes; **required in dating (Pacaran) mode only**. Engineering: gate `required` validator on `mode === 'pacaran'`. Reason: hospitality lens (BLE-87) — admit deconstruction-phase, new convert, hurt-by-church users into non-dating modes without forcing categorization.

## 3. Marriage timeline (Screen 07a, Pacaran-only)

- Last radio option label: **"Masih berdoa"** (was "Belum pasti, sedang mencari arah" / "Pray").
- EN fallback: "Still praying about it".
- Position: 4th / last radio option. Not pre-selected.
- Reason: marriage = covenant decision (Pengkhotbah 3:1 TB2). "Masih berdoa" honors discernment without urgency, native Bahasa, no English code-switch.

## i18n keys updated

- `faith.denominationLabels.belumYakin`
- `faith.denominationHint`
- `faith.pelayanan.{label,hint,chips.*}`
- `faith.marriageTimeline.{within1,1to3,moreThan3,stillPraying}`

Files: `ble-46-i18n/locales/en.json`, `ble-46-i18n/locales/id.json`.

## Acceptance (re-review by Pastor on closure)

- [ ] Pelayanan header replaces "Spiritual gifts" — chips intact.
- [ ] Denomination optional outside dating mode; "Belum yakin / Masih mencari" appears last; never auto-selected.
- [ ] Marriage timeline radio reads "Masih berdoa".
- [ ] EN fallbacks present for all three.

## Out of scope

Iconography hi-fi. Separate ticket post hi-fi visual ship.

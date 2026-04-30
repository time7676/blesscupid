# BLE-148 — `$ban_canonical_heading` + `$ban_scripture_disclaimer` visual spec

**Designer:** FoundingDesigner · **Status:** ready for Pastor sign-off + Engineer wiring
**Source:** [BLE-31](/BLE/issues/BLE-31) §10 amendment v1.2 #3 + §10.6 · [BLE-54](/BLE/issues/BLE-54) prototype `.ban-heading`
**Surfaces:** [BLE-26](/BLE/issues/BLE-26) chat moderation Voice 03 ban-screen · [BLE-27](/BLE/issues/BLE-27) safety ban surface · [BLE-65](/BLE/issues/BLE-65) admin host-shell ban view

---

## 1. Doctrine framing

`$ban_canonical_heading` is **fixed framing** (Voice 03). It appears on every ban surface, before any per-case explanation. The line is the pastoral promise that frames the entire screen — *"the door of restoration remains open"* — and is rendered before the user reads what was done or why.

`$ban_scripture_disclaimer` is the **mandatory cite-line suffix** for any scripture that ships on a ban surface. Format is fixed: `{ref} · {tx} · {disclaimer}`. The suffix prevents the verse from reading as a verdict; it positions scripture as pastoral note.

Both keys live at bundle root in `copy-bundle.json`. Engineer reads them through `pipeline.renderAction(decision, locale, { bundle })`. Designer never duplicates the strings into per-category copy.

## 2. Anatomy — ban surface stack (top → bottom)

```
┌─────────────────────────────────────────────────────┐
│  [dove crest]                                       │  cream canvas
│                                                     │
│  The door of restoration remains open.              │  ← $ban_canonical_heading (NEW)
│                                                     │
│  We're holding your profile for now                 │  ← per-case title (per-category)
│                                                     │
│  Body — what was seen, why, the door back.          │
│                                                     │
│  ┌─ door block ──────────────────────────────────┐ │
│  │ Pintu pemulihan tetap terbuka                 │ │  ← per-case door-label (existing)
│  │ Appeal info / restoration step                │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┃ "scripture text…"                                │  gold-500 left rule
│  ┃ Eph 4:25 · NIV · pastoral note, not a verdict   │  ← cite-line w/ §10.6 suffix
│                                                     │
│  [ Submit appeal ]                                  │  cobalt CTA
│  care@blesscupid.app · 14 days from today           │
└─────────────────────────────────────────────────────┘
```

### Element: `.ban-canonical-heading`

| Property | Value |
|---|---|
| Position | Directly under crest, above per-case title |
| Margin | `0 0 16px` (top auto, separator from crest = `--space-3`, separator below before per-case title = `--space-4`) |
| Font family | `var(--font-display)` — Source Serif 4 |
| Font size | `20px` (mobile) / `22px` (≥768px) |
| Line height | `1.35` |
| Weight | `500` |
| Style | `italic` — set off as scripture register, distinct from sans per-case title |
| Color | `var(--bc-gold-700)` (`#8C6822`) — illuminated, sacred. Passes WCAG AA on `--bg-canvas` (`#FDFBF6`) at 4.6:1 contrast |
| Letter-spacing | `-0.005em` |
| Max-width | `28ch` — hold a scripture-like measure; allow natural wrap |
| Text-wrap | `balance` (where supported) |
| Forbidden | Uppercase, all-caps, eyebrow micro-treatment, panic-exit red token |

**Visual relationship to per-case title.** The per-case title (`.ban-screen__title`) drops one weight increment for hierarchy clarity:

- `.ban-canonical-heading` — 20px serif italic, gold-700
- `.ban-screen__title` — 22px sans semibold (600), `--text-primary`

The canonical heading carries pastoral tone (italic gold-700 serif). The per-case title carries factual register (sans semibold stone-900). They read as two voices on the same page — exactly the doctrine.

### Element: `.ban-screen__verse-cite` (cite-line)

| Property | Value |
|---|---|
| Format | `{ref} · {tx} · {disclaimer}` — middot `·` separators with hair-space ` ` on each side, or fall back to ` ` |
| Font family | `var(--font-body)` — Inter |
| Font size | `12px` |
| Line height | `1.55` |
| Color | `var(--text-tertiary)` (`#867C6A`) |
| Style | Disclaimer suffix only: `font-style: italic` to distinguish from `{ref}` and `{tx}` |
| Letter-spacing | `0.02em` |
| Wrapping | Allow soft wrap. On wrap, suffix breaks to its own line in same italic 12px tertiary |
| Margin | `6px 0 0` from verse text |

**Markup pattern (engineer reference):**

```html
<blockquote class="ban-screen__verse">
  "{verse text in active locale}"
  <span class="ban-screen__verse-cite">
    <span class="cite-ref">{ref}</span>
    <span class="cite-sep" aria-hidden="true"> · </span>
    <span class="cite-tx">{tx}</span>
    <span class="cite-sep cite-sep--disclaimer" aria-hidden="true"> · </span>
    <em class="cite-disclaimer">{$ban_scripture_disclaimer[locale]}</em>
  </span>
</blockquote>
```

The disclaimer is wrapped in `<em>` so screen readers announce it with emphasis. The middot separators are `aria-hidden="true"` so screen readers do not literalize "middot middot middot."

### Element: `.ban-screen__crest` (existing — no change)

Dove crest stays. 56×56px, gold-100 fill, gold-300 stroke, gold-700 glyph. Renders above canonical heading with `margin: 0 0 24px`.

## 3. Locale rendering

| Locale | `$ban_canonical_heading` | `$ban_scripture_disclaimer` |
|---|---|---|
| `en` | "The door of restoration remains open." | "pastoral note, not a verdict" |
| `id` | "Pintu pemulihan tetap terbuka." | "catatan pastoral, bukan vonis" |

Lookup pattern: `bundle.$ban_canonical_heading[locale] ?? bundle.$ban_canonical_heading.en` (existing prototype semantics — preserve).

**ID-default surface.** App default locale is `id`. EN is fallback / locale-toggle. Test both at every snapshot site. Indonesian copy is shorter (33 chars vs 39), so test wrap behavior in narrow phones (320px viewport). At 20px serif italic with 28ch max-width, both locales fit on one line at ≥360px width and wrap to two lines at 320px.

**No mixed-locale renders.** Heading + cite-line suffix + per-case title + body MUST all resolve from the same `locale` parameter. If the app is mid-toggle and one key is missing in the active locale, fall back uniformly to `en` for that surface render — never partial-fallback.

## 4. Disclaimer omission rules (engineer-applied)

The renderer omits the disclaimer suffix entirely when:

- `actor_profile.faith_origin in {atheist, agnostic, seeker}` (per BLE-31 §10.3)
- `category in {csam, scam_ring}` — `voice_03_disclaimer_required: false` already set in `copy-bundle.json` for `financial.ban` and `csam` rows
- The action template's `scripture` is `null` (no scripture, no cite-line, no suffix)

When omitted, the cite-line collapses to `{ref} · {tx}` only. **The canonical heading is NEVER omitted** on a ban surface — it ships on every locale, every category, every actor profile.

**Forbidden surface guard.** Per `rules.json#panic_exit.forbidden_surfaces`, the panic-exit red token (`--state-panic-exit: #B5341F`) MUST NOT appear on the ban surface — including any sub-element of the canonical heading or cite-line. Use cobalt for action, gold for canonical heading, stone-tertiary for cite-line. No reds.

## 5. CSS handoff

```css
/* Canonical heading — Voice 03 fixed framing.
   Sits between dove crest and per-case title.
   Rendered on every ban surface. Never omitted. */
.ban-canonical-heading {
  font-family: var(--font-display);
  font-weight: 500;
  font-style: italic;
  font-size: 20px;
  line-height: 1.35;
  letter-spacing: -0.005em;
  color: var(--bc-gold-700);
  margin: 0 0 16px;
  max-width: 28ch;
  text-wrap: balance;
}
@media (min-width: 768px) {
  .ban-canonical-heading { font-size: 22px; }
}

/* Per-case title drops one weight increment to defer to canonical heading. */
.ban-screen__title {
  font-family: var(--font-body);  /* was --font-display in pre-148 prototype */
  font-weight: 600;
  font-size: 22px;
  line-height: 1.25;
  color: var(--text-primary);
  margin: 0 0 12px;
  letter-spacing: -0.01em;
}

/* Scripture cite-line — supports {ref} · {tx} · {disclaimer} */
.ban-screen__verse-cite {
  display: block;
  font-family: var(--font-body);
  font-style: normal;
  font-size: 12px;
  color: var(--text-tertiary);
  letter-spacing: 0.02em;
  margin-top: 6px;
  line-height: 1.55;
}
.ban-screen__verse-cite .cite-disclaimer {
  font-style: italic;
}
```

## 6. Acceptance — Designer hand-off checklist

- [x] Visual treatment specified for canonical heading on every ban screen — cream canvas + dove crest + heading.
- [x] Cite-line typographic treatment specified with §10.6 disclaimer suffix.
- [x] References [BLE-54 prototype](/BLE/issues/BLE-54) `.ban-heading` div semantics.
- [x] Voice 03 register verified — calm, restoration-frame, NOT corporate (italic serif gold, not bold sans red).
- [x] Locale-aware rendering rules specified (EN + ID, fallback uniformity).
- [x] No panic-exit red token on any element. Verified against `rules.json#panic_exit.forbidden_surfaces`.
- [x] Visual mockup at `index.html` (this folder) demonstrates EN + ID side-by-side at 360px viewport.
- [x] Prototype `.ban-heading` styling updated in `_default/ble-54-moderation-pipeline/console.css` to match this spec.
- [x] BLE-26 ban-screen reference example updated in `_default/ble-26-chat-moderation/index.html` to demonstrate the canonical heading position above the per-case title.

## 7. Engineer hand-off — what to wire

After Pastor sign-off, FoundingEngineer wires:

1. `pipeline.renderAction(decision, locale, { bundle })` already returns `canonical_heading` (string) + `scripture_cite` (object with `ref`, `tx`, `disclaimer?`). Read both off the result.
2. BLE-26 / BLE-27 / BLE-65 ban-screen templates render `.ban-canonical-heading` element above the existing `.ban-screen__title`. Use markup pattern from §2.
3. Cite-line uses markup pattern from §2 — middots `aria-hidden="true"`, disclaimer wrapped in `<em>` with class `cite-disclaimer`.
4. Snapshot tests: render both locales (`en`, `id`) on at least three categories — `harassment.ban`, `fake.ban`, `doctrinal.ban` — and one disclaimer-omission case (`financial.ban`).
5. Forbidden-vocab regression: `expect(rendered).not.toMatch(/diblokir|permanently banned|account banned/i)` on every snapshot.
6. Locale switch: toggle locale at runtime, verify canonical heading + per-case title + cite-line all flip atomically (no partial-locale renders).

## 8. Open questions for Pastor

- Confirm canonical heading sits **above** per-case title (this spec) vs. as eyebrow above crest (alternate).
- Confirm 20px serif italic gold-700 carries the right pastoral register — alternative would be 18px italic stone-900 with hairline gold underline (more whisper-quiet).
- Confirm disclaimer suffix italicizes (this spec) vs. stays plain tertiary like `{ref}` and `{tx}`.

If alternate is preferred, this spec rev'd same-day.

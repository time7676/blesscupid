# String ID Conventions

## Format

`<namespace>.<feature>.<element>[.<modifier>]`

Lowercase, dot-separated, camelCase segments.

| Good | Bad |
|---|---|
| `match.feed.empty.title` | `MatchFeedEmptyTitle` |
| `auth.otp.resendNow` | `auth.otp.resend_now` |
| `safety.report.reasons.fakeProfile` | `safety.report.reasons.fake-profile` |
| `errors.validation.required` | `validation_error_required_field` |

## Namespaces (top-level keys)

| Namespace | Scope |
|---|---|
| `common` | Cross-feature primitives: actions (continue/cancel), states (loading/empty), labels reused everywhere |
| `auth` | Onboarding, login, OTP, consent |
| `match` | Feed, swipe card, match modal |
| `profile` | View/edit profile, completion progress |
| `safety` | Report, block, unmatch, safety center |
| `faith` | Verse-of-day, prayer, denomination labels, faith values. **Pastor-gated.** |
| `errors` | All error messages (network, validation, auth-specific) |

Add a new namespace only when a feature has ≥10 strings that don't fit anywhere else. Until then, prefer extending an existing namespace.

## Sub-keys

- `title` — heading
- `subtitle` — secondary heading
- `body` — paragraph copy
- `cta` — primary action button label
- `placeholder` — input placeholder
- `helper` — helper text under input
- `error` — error variant of the same element
- `empty.title` / `empty.subtitle` — empty-state pair
- `confirmTitle` / `confirmBody` / `confirmCta` — confirm-dialog triplet

Reuse these consistently; engineers can grep for `.cta`, `.empty.title`, etc.

## Variable placeholders

- Always **named**: `{name}`, `{age}`, `{percent}`, `{km}`.
- Never positional `{0}`, `{1}`.
- Pluralized counts: `{n, plural, one {…} other {…}}`. Variable name is `n` when generic, otherwise descriptive (`{seconds, plural, …}`).

## Reserved variable names

| Name | Type | Used for |
|---|---|---|
| `{name}` | string | User display name |
| `{phone}` | string | Phone number (formatted) |
| `{age}` | number | Years (use plural form in en) |
| `{km}` | number | Distance |
| `{percent}` | number | 0–100 (text fragment, not Intl percent) |
| `{seconds}` | number | Countdown |
| `{count}` | number | Generic count when the noun is implicit |
| `{field}` | string | Field label in validation errors |
| `{min}` / `{max}` | number | Validation bounds |

## What NOT to do

- ❌ Don't put HTML in values. Use `<Trans>` or component-interpolation in React.
- ❌ Don't concatenate two keys at runtime to form a sentence — grammar breaks across locales.
- ❌ Don't put hardcoded numbers (`"50%"`, `"Rp 50.000"`) in values. Use formatters.
- ❌ Don't reuse the same key for two contexts ("Send" the verb vs "Send" the noun). Make two keys: `common.actions.send`, `chat.messageType.send`.
- ❌ Don't write English-only strings in `id.json`. If the Bahasa is missing, the key isn't ready.

## Examples

```json
{
  "match": {
    "matched": {
      "title": "You blessed each other!",
      "subtitle": "Start a conversation with {name}.",
      "cta": "Say hi first"
    }
  }
}
```

```tsx
t('match.matched.title');
t('match.matched.subtitle', { name: profile.name });
```

# BlessCupid mobile DS — non-negotiable rules

This file documents the patterns the design system bakes in so screens don't
re-invent them and re-introduce mistakes (notch overlap, tiny tap targets,
post-auth nav dead-ends). Read before adding a new screen.

## Safe-area

**Never hand-pad for the status bar / notch / home indicator.** The
primitives consume safe-area for you.

| Primitive | Top inset | Bottom inset | When to use |
|---|---|---|---|
| `<Screen edges={['top','left','right','bottom']}>` | yes | yes | full-bleed wrappers |
| `<ScreenHeader />` | **yes (consumes `insets.top` automatically)** | n/a | every screen with a header |
| Hero / decorative band | no — bleed under notch is intentional | n/a | onboarding hero, splash |
| Bottom CTA cluster | n/a | apply `Math.max(insets.bottom, space.s8)` inline | screens with primary action at the foot |

If a screen has a `ScreenHeader`, you do **not** add `paddingTop`.
If a screen has a bottom button, you **do** call `useSafeAreaInsets()` and
pad the CTA wrapper.

## Buttons

`<Button>` defaults to `alignSelf: 'flex-start'` (text-width, hugs label).
That is correct for inline / compact actions only.

For **flow buttons** (sign in, continue, accept covenant, primary CTA on a
screen): always pass `full`. Without `full` the button looks tiny and gives
the impression the affordance is broken.

Do **not** wrap a `Button` in a `<View style={{ alignSelf: 'stretch' }}>` —
use the `full` prop. It also pads `alignSelf: 'stretch'` correctly inside
flex parents.

### Variant contract

| Variant | When | `full` default |
|---|---|---|
| `primary` | one per screen, the dominant CTA | yes for flow screens |
| `secondary` | bordered, alt action ("Sign in instead", OAuth providers) | yes for flow screens |
| `ghost` | inline link, low affordance ("Read terms") | usually no |

A *real* clickable secondary action on an auth/onboarding screen MUST be
`secondary`, never `ghost`. The underline-only ghost variant reads as
plain text on first glance and Julian will tell you it's not clickable.

## Navigation

Auth-state-driven stack swap lives in `App.tsx`. The RootStack renders
**exactly one** of {AuthStack, OnboardingStack, AppShell} based on
`useAuth().userId` + the onboarding-completion flag.

Implication for auth screens:

- **Do not call `navigation.reset()` to onboarding routes from inside
  AuthStack.** Those names are not registered in the active stack, the
  reset throws, and the user sees nothing happen. Just call
  `setSession(tokens)` — RootStack swaps the tree on next render and
  OnboardingStack mounts at its first declared screen.

- Inverse rule: AppShell screens that log out call `signOut()` only.
  RootStack handles the swap.

## Touch targets

iOS HIG minimum tap target = 44pt. The Button primitive hits this with
`paddingVertical: 14 / 13 / 12` for primary/secondary/ghost respectively.
Don't override paddings below those values.

For tappable text (e.g. "Forgot password?" inline link) wrap in a
`<Pressable style={{ padding: space.s3 }}>` so the hit area is at least
~44pt regardless of font size.

## Keyboard

Forms wrap in `<KeyboardAvoidingView behavior={Platform.OS === 'ios' ?
'padding' : undefined}>` so the keyboard doesn't cover the submit button.
Always pair with `<ScrollView keyboardShouldPersistTaps="handled">` so the
user can tap a button without dismissing the keyboard first.

## Tokens, not hex

No `#fff`, no `#1a1a1a`. Use `color.parchment.*`, `color.ink.*`,
`color.warning.*`, etc. Same for spacing (`space.s4`, never `16`) and type
(`fontFamily.serif`, `fontSize.body`).

The `progress.txt` rolls forward as we migrate older screens off raw hex.

## Don't ship without

- `pnpm -F @blesscupid/mobile typecheck` clean
- `npx expo export --platform ios --output-dir /tmp/<x>` succeeds
- Manual smoke on Expo Go (or simulator): button tappable, no notch
  overlap, keyboard doesn't hide the CTA.

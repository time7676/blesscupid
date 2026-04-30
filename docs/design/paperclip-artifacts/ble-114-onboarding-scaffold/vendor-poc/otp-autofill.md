# OTP autofill PoC

## iOS — built-in, no SDK

Each `<TextInput>` digit cell sets:

```ts
<TextInput
  textContentType="oneTimeCode"
  keyboardType="number-pad"
  autoComplete="sms-otp"  // RN >= 0.74
  ...
/>
```

iOS 12+ surfaces the OTP from Messages above the keyboard. Works for Twilio Verify SMS as long as the SMS body contains "Your code is 123456" or "123456 is your code" — Twilio Verify default templates already match.

**Test devices:** iPhone 14 Pro (iOS 17), iPhone 11 (iOS 16). Both verified working in PoC of the predecessor BLE-1x app.

## Android — `react-native-otp-verify`

```
pnpm add react-native-otp-verify
```

Uses the Google SMS Retriever API. Does **not** require `READ_SMS` permission. Requirements:

1. SMS body must end with an 11-character app hash. Twilio Verify accepts a custom template parameter `appHash`. Hash is generated once via:
   ```
   ./gradlew :app:hashstring   # via the SDK's helper
   ```
   Output, e.g.: `oNTNNWZb5QZ`
2. Append the hash to the SMS template in Twilio Verify console: `Kode BlessCupid: {{code}}. oNTNNWZb5QZ`
3. Hook on screen 02b:
   ```ts
   useEffect(() => {
     RNOtpVerify.getOtp().then(() =>
       RNOtpVerify.addListener((message) => {
         const m = message?.match(/(\d{6})/);
         if (m) handleAutoFill(m[1]);
       }),
     );
     return () => { RNOtpVerify.removeListener(); };
   }, []);
   ```
4. Foreground listener only — backgrounded apps don't receive the broadcast. Acceptable since OTP screen is foreground.

## Expo compatibility

`react-native-otp-verify` requires native code → need `expo prebuild`. BLE-13 must ship prebuild. If BLE-13 ships Expo Go only, escalate as blocker — auto-fill is a v1.0 acceptance criterion.

## Manual paste fallback

Both platforms support clipboard paste into `<OTPInput>`. The `<OTPInput>` component scans pasted text for 6 digits and distributes across cells. This is the safety net if SMS retriever fails (e.g. user got SMS on different device).

## PoC verdict criteria

Acceptance per spec: "OTP autofill verified on at least one Android device + one iOS device." Test plan:

- Provision Twilio Verify with template + appHash.
- Trigger OTP from staging build on Pixel 7 (Android 14) → SMS arrives → 6 digits auto-fill within 5s. Verified.
- Trigger OTP on iPhone 14 → quick-bar shows code → tap → fills. Verified.
- Negative: airplane mode → no SMS → manual entry still works.

Document results in BLE-114 comment thread before closing.

import { useEffect, useRef } from 'react';
import { Platform, TextInput, View, Text } from 'react-native';
import { tokens } from '../../lib/tokens';

export type OTPInputProps = {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  onComplete?: (code: string) => void;
  error?: string;
  autoFocus?: boolean;
};

export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error,
  autoFocus,
}: OTPInputProps) {
  const refs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (value.length === length) onComplete?.(value);
  }, [value, length, onComplete]);

  // Android SMS Retriever wiring lives in the screen, not here, to keep this
  // component pure. Screen 02b mounts `RNOtpVerify.getOtp()` and calls
  // `onChange(code)` when a 6-digit match arrives.

  const setDigit = (i: number, d: string) => {
    const sanitized = d.replace(/\D/g, '');
    if (sanitized.length > 1) {
      // paste path
      const next = sanitized.slice(0, length).padEnd(length, ' ').replace(/ /g, '');
      onChange(next);
      const focusIdx = Math.min(next.length, length - 1);
      refs.current[focusIdx]?.focus();
      return;
    }
    const arr = value.split('');
    arr[i] = sanitized;
    const next = arr.join('').slice(0, length);
    onChange(next);
    if (sanitized && i + 1 < length) refs.current[i + 1]?.focus();
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: tokens.space[3], justifyContent: 'center' }}>
        {Array.from({ length }).map((_, i) => (
          <TextInput
            key={i}
            ref={(r) => {
              if (r) refs.current[i] = r;
            }}
            accessibilityLabel={`Digit ${i + 1} dari ${length}`}
            value={value[i] ?? ''}
            onChangeText={(d) => setDigit(i, d)}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !value[i] && i > 0) {
                refs.current[i - 1]?.focus();
              }
            }}
            keyboardType="number-pad"
            maxLength={Platform.OS === 'ios' && i === 0 ? length : 1}
            // iOS native one-time-code autofill on the first cell.
            textContentType={i === 0 ? 'oneTimeCode' : 'none'}
            autoComplete={i === 0 ? 'sms-otp' : 'off'}
            autoFocus={autoFocus && i === 0}
            style={{
              width: 48,
              height: 56,
              textAlign: 'center',
              fontFamily: tokens.font.body,
              fontSize: tokens.size.heading.lg,
              color: tokens.color.text.primary,
              borderWidth: 1,
              borderColor: error
                ? tokens.color.state.critical
                : value[i]
                ? tokens.color.border.focus
                : tokens.color.border.subtle,
              borderRadius: tokens.radius.md,
              backgroundColor: tokens.color.bg.surface,
            }}
          />
        ))}
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{
            marginTop: tokens.space[4],
            textAlign: 'center',
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.sm,
            color: tokens.color.state.critical,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

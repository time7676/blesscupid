import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  border,
  color,
  fontFamily,
  fontSize,
  radius,
  space,
} from '../tokens.js';

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
  // component pure. The screen mounts `RNOtpVerify.getOtp()` and calls
  // `onChange(code)` when a 6-digit match arrives.

  const setDigit = (i: number, d: string) => {
    const sanitized = d.replace(/\D/g, '');
    if (sanitized.length > 1) {
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
      <View style={styles.row}>
        {Array.from({ length }).map((_, i) => {
          const filled = Boolean(value[i]);
          const cellStyle = [
            styles.cell,
            filled ? styles.cellFilled : null,
            error ? styles.cellError : null,
          ];
          return (
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
              textContentType={i === 0 ? 'oneTimeCode' : 'none'}
              autoComplete={i === 0 ? 'sms-otp' : 'off'}
              autoFocus={autoFocus && i === 0}
              style={cellStyle}
            />
          );
        })}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.s2,
    justifyContent: 'center',
  },
  cell: {
    width: 48,
    height: 56,
    textAlign: 'center',
    fontFamily: fontFamily.sans,
    fontSize: fontSize.h3,
    color: color.ink.default,
    borderWidth: border.thin,
    borderColor: color.hairline.default,
    borderRadius: radius.md,
    backgroundColor: color.parchment.raised,
  },
  cellFilled: {
    borderColor: color.indigo.default,
  },
  cellError: {
    borderColor: color.feedback.warning,
  },
  error: {
    marginTop: space.s3,
    textAlign: 'center',
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.feedback.warning,
  },
});

import { StyleSheet, Text, TextInput, View } from 'react-native';
import {
  border,
  color,
  fontFamily,
  fontSize,
  radius,
  space,
} from '../tokens.js';

export type PhoneInputProps = {
  value: string;
  onChange: (v: string) => void;
  defaultCountry?: string;
  error?: string;
  autoFocus?: boolean;
  testID?: string;
};

export function PhoneInput({
  value,
  onChange,
  defaultCountry = 'ID',
  error,
  autoFocus,
  testID,
}: PhoneInputProps) {
  const dial = defaultCountry === 'ID' ? '+62' : defaultCountry;
  return (
    <View>
      <View style={[styles.field, error ? styles.fieldError : null]}>
        <Text style={styles.dial}>{dial}</Text>
        <TextInput
          testID={testID}
          accessibilityLabel="Nomor HP"
          value={value}
          onChangeText={onChange}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          autoFocus={autoFocus}
          placeholder="812 ..."
          placeholderTextColor={color.ink.soft}
          style={styles.input}
        />
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
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderWidth: border.thin,
    borderColor: color.hairline.default,
    borderRadius: radius.md,
    paddingHorizontal: space.s4,
    backgroundColor: color.parchment.raised,
  },
  fieldError: {
    borderColor: color.feedback.warning,
  },
  dial: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodyLg,
    color: color.ink.soft,
    marginRight: space.s3,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodyLg,
    color: color.ink.default,
    paddingVertical: space.s3,
  },
  error: {
    marginTop: space.s2,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.feedback.warning,
  },
});

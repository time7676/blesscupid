import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import {
  border,
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  lineHeight,
  radius,
  space,
  tracking,
} from '../tokens.js';

export type FormInputProps = Omit<TextInputProps, 'style'> & {
  label: string;
  required?: boolean;
  helper?: string;
  error?: string | null;
  multiline?: boolean;
};

export function FormInput({
  label,
  required = false,
  helper,
  error,
  multiline = false,
  onFocus,
  onBlur,
  editable = true,
  ...rest
}: FormInputProps) {
  const [focused, setFocused] = useState(false);
  const showError = Boolean(error);

  const inputStyle = [
    multiline ? styles.textarea : styles.input,
    focused && !showError ? styles.inputFocused : null,
    showError ? styles.inputError : null,
    !editable ? styles.inputDisabled : null,
  ];

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.req}> *</Text> : null}
      </Text>
      <TextInput
        {...rest}
        editable={editable}
        multiline={multiline}
        placeholderTextColor={color.ink.soft}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={inputStyle}
      />
      {showError ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
}

const baseInput = {
  paddingHorizontal: space.s4,
  fontFamily: fontFamily.sans,
  fontSize: fontSize.bodyLg,
  color: color.ink.default,
  backgroundColor: color.parchment.raised,
  borderWidth: border.thin,
  borderColor: color.hairline.default,
  borderRadius: radius.lg,
};

const styles = StyleSheet.create({
  field: {
    marginBottom: space.s6,
  },
  label: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.label,
    color: color.ink.default,
    letterSpacing: letterSpacingFor(tracking.label, fontSize.label),
    marginBottom: 6,
  },
  req: {
    color: color.gold.default,
  },
  input: {
    ...baseInput,
    height: 52,
  },
  textarea: {
    ...baseInput,
    minHeight: 120,
    paddingVertical: 14,
    lineHeight: lineHeight.bodyLg,
    textAlignVertical: 'top',
  },
  inputFocused: {
    borderColor: color.gold.default,
    backgroundColor: color.parchment.default,
  },
  inputError: {
    borderColor: color.feedback.warning,
    backgroundColor: color.feedback.warningTint,
  },
  inputDisabled: {
    backgroundColor: color.sandstone.default,
    color: color.ink.soft,
  },
  helper: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
    lineHeight: lineHeight.body,
    marginTop: 6,
  },
  errorText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.feedback.warning,
    lineHeight: lineHeight.body,
    marginTop: 6,
  },
});

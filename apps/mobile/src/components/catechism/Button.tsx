import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { palette, radius, semantic, spacing } from '../../theme/tokens.js';

type Variant = 'primary' | 'ghost' | 'text';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  busy?: boolean;
  busyLabel?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  children?: ReactNode;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  busy = false,
  busyLabel,
  style,
  accessibilityLabel,
}: Props) {
  const isDisabled = disabled || busy;
  const baseStyle = stylesByVariant[variant];
  const labelStyle = labelStylesByVariant[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy }}
      disabled={isDisabled}
      onPress={onPress}
      style={[styles.base, baseStyle, isDisabled && variant === 'primary' && styles.primaryDisabled, style]}
    >
      <Text style={[styles.label, labelStyle, isDisabled && variant === 'primary' && styles.primaryDisabledLabel]}>
        {busy && busyLabel ? busyLabel : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.s7,
  },
  primary: { backgroundColor: palette.cobalt600 },
  primaryDisabled: { backgroundColor: palette.cobalt100 },
  primaryDisabledLabel: { color: palette.cobalt300 },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: palette.cream300,
  },
  text: {
    backgroundColor: 'transparent',
    minHeight: 44,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.16,
  },
  primaryLabel: { color: palette.white },
  ghostLabel: { color: palette.cobalt700 },
  textLabel: {
    color: palette.cobalt700,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

const stylesByVariant = {
  primary: styles.primary,
  ghost: styles.ghost,
  text: styles.text,
} satisfies Record<Variant, StyleProp<ViewStyle>>;

const labelStylesByVariant = {
  primary: styles.primaryLabel,
  ghost: styles.ghostLabel,
  text: styles.textLabel,
} satisfies Record<Variant, StyleProp<TextStyle>>;

void semantic;

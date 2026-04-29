import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { color, radius, fontFamily, fontSize, letterSpacingFor, tracking } from '../tokens.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  full?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  disabled = false,
  full = false,
  ...rest
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      {...rest}
    >
      {({ pressed }) => {
        const styles = stylesFor(variant, disabled, pressed);
        return (
          <View style={[styles.container, full ? fullWidth : null]}>
            <Text style={styles.label} numberOfLines={1}>
              {label}
            </Text>
          </View>
        );
      }}
    </Pressable>
  );
}

const fullWidth: ViewStyle = { alignSelf: 'stretch' };

function stylesFor(variant: ButtonVariant, disabled: boolean, pressed: boolean) {
  const baseContainer: ViewStyle = {
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  };
  const baseLabel: TextStyle = {
    fontFamily: fontFamily.serifMedium,
    fontSize: 17,
    letterSpacing: letterSpacingFor(tracking.label, 17),
  };

  if (variant === 'primary') {
    const fill = disabled
      ? color.hairline.default
      : pressed
        ? color.ink.pressed
        : color.ink.default;
    return StyleSheet.create({
      container: {
        ...baseContainer,
        backgroundColor: fill,
        paddingVertical: 14,
        paddingHorizontal: 28,
        transform: [{ translateY: pressed && !disabled ? 1 : 0 }],
      },
      label: {
        ...baseLabel,
        color: disabled ? color.ink.soft : color.parchment.default,
      },
    });
  }

  if (variant === 'secondary') {
    const borderColor = disabled
      ? color.hairline.soft
      : pressed
        ? color.ink.default
        : color.hairline.default;
    const bg = pressed && !disabled ? color.sandstone.default : color.parchment.raised;
    return StyleSheet.create({
      container: {
        ...baseContainer,
        backgroundColor: bg,
        paddingVertical: 13,
        paddingHorizontal: 26,
        borderWidth: 1,
        borderColor,
      },
      label: {
        ...baseLabel,
        color: disabled ? color.ink.soft : color.ink.default,
      },
    });
  }

  // ghost — sans label with hairline underline
  const ghostUnderline = disabled
    ? color.hairline.soft
    : pressed
      ? color.ink.default
      : color.hairline.default;
  const ghostColor = disabled
    ? color.ink.soft
    : pressed
      ? color.ink.default
      : color.indigo.default;
  return StyleSheet.create({
    container: {
      ...baseContainer,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 0,
      borderBottomWidth: 1,
      borderBottomColor: ghostUnderline,
    },
    label: {
      fontFamily: fontFamily.sansMedium,
      fontSize: fontSize.label,
      letterSpacing: letterSpacingFor(tracking.label, fontSize.label),
      color: ghostColor,
    },
  });
}

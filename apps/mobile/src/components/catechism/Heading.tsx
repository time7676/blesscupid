import { StyleSheet, Text, type TextProps } from 'react-native';
import { palette } from '../../theme/tokens.js';

export function Eyebrow({ style, children, ...rest }: TextProps) {
  return (
    <Text style={[styles.eyebrow, style]} {...rest}>
      {children}
    </Text>
  );
}

export function Title({ style, children, ...rest }: TextProps) {
  return (
    <Text style={[styles.title, style]} accessibilityRole="header" {...rest}>
      {children}
    </Text>
  );
}

export function SubText({ style, children, ...rest }: TextProps) {
  return (
    <Text style={[styles.sub, style]} {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: palette.cobalt600,
    marginTop: 4,
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Source Serif 4',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '500',
    color: palette.cobalt900,
    marginBottom: 12,
  },
  sub: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 22,
    color: palette.stone700,
    marginBottom: 24,
  },
});

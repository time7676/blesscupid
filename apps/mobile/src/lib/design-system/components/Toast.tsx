import { StyleSheet, Text, View } from 'react-native';
import {
  color,
  fontFamily,
  fontSize,
  radius,
  space,
} from '../tokens.js';

export type ToastVariant = 'critical' | 'warning' | 'success';

export type ToastProps = {
  variant: ToastVariant;
  message: string;
};

// `critical` uses amber-tinted warning, never red — keeps the system reverent
// rather than alarming.
const accentFor = (v: ToastVariant): string => {
  switch (v) {
    case 'critical':
    case 'warning':
      return color.feedback.warning;
    case 'success':
      return color.feedback.success;
  }
};

export function Toast({ variant, message }: ToastProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.toast, { borderLeftColor: accentFor(variant) }]}
    >
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    backgroundColor: color.parchment.raised,
    borderLeftWidth: 4,
    borderRadius: radius.md,
    paddingHorizontal: space.s4,
    paddingVertical: space.s3,
    marginHorizontal: space.s4,
    marginBottom: space.s4,
    shadowColor: '#142428',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  message: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.ink.default,
  },
});

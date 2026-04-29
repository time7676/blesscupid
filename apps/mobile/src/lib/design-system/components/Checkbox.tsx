import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  border,
  color,
  fontFamily,
  fontSize,
  lineHeight,
  radius,
  space,
} from '../tokens.js';

export type CheckboxProps = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  error?: string;
  testID?: string;
};

// Anti-dark-pattern guardrail: no `defaultChecked` prop. Host owns state and must
// pass `checked={false}` on first render. The `no-default-checked` lint rule
// enforces this at usage sites.
export function Checkbox({ checked, onChange, label, error, testID }: CheckboxProps) {
  const boxStyle = [
    styles.box,
    checked ? styles.boxChecked : null,
    error ? styles.boxError : null,
  ];
  return (
    <View>
      <Pressable
        testID={testID}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={styles.row}
      >
        <View style={boxStyle}>
          {checked ? <Text style={styles.glyph}>✓</Text> : null}
        </View>
        <View style={styles.labelWrap}>
          {typeof label === 'string' ? <Text style={styles.label}>{label}</Text> : label}
        </View>
      </Pressable>
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
    alignItems: 'flex-start',
    gap: space.s3,
    minHeight: 44,
  },
  box: {
    marginTop: 2,
    width: 22,
    height: 22,
    borderWidth: border.thick,
    borderColor: color.hairline.strong,
    borderRadius: radius.sm,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    // v1.1 — amber selection, not blue
    borderColor: color.warning[700],
    backgroundColor: color.warning[700],
  },
  boxError: {
    borderColor: color.feedback.warning,
  },
  glyph: {
    color: color.parchment.default,
    fontSize: 14,
    fontFamily: fontFamily.sansSemibold,
  },
  labelWrap: {
    flex: 1,
  },
  label: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    color: color.ink.default,
  },
  error: {
    marginTop: space.s2,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.feedback.warning,
  },
});

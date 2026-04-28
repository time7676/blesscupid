import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radius, spacing } from '../../theme/tokens.js';

interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  helper?: ReactNode;
}

/**
 * Ack row — cobalt-600 outline + filled (constraint 4, no amber).
 * 48pt min touch target on the entire row (constraint 6).
 */
export function Ack({ checked, onChange, label, helper }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={() => onChange(!checked)}
      style={styles.row}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Text style={styles.mark}>✓</Text> : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.label}>{label}</Text>
        {helper ? <View style={styles.helperWrap}>{helper}</View> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: spacing.s4,
    paddingHorizontal: spacing.s2,
    minHeight: 48,
    alignItems: 'flex-start',
  },
  box: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: palette.cobalt600,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  boxChecked: {
    backgroundColor: palette.cobalt600,
  },
  mark: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 14,
  },
  body: { flex: 1 },
  label: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 21,
    color: palette.stone900,
  },
  helperWrap: { marginTop: 6 },
});

void radius;

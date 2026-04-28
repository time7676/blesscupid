import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radius, spacing } from '../../theme/tokens.js';

interface Props {
  label: string;
  sub?: string;
  checked: boolean;
  onPress: () => void;
}

export function RadioCard({ label, sub, checked, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={[styles.card, checked && styles.cardChecked]}
    >
      <View style={[styles.dot, checked && styles.dotChecked]}>
        {checked ? <View style={styles.inner} /> : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.label}>{label}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 60,
    paddingVertical: spacing.s5,
    paddingHorizontal: spacing.s6,
    borderWidth: 1.5,
    borderColor: palette.cream300,
    borderRadius: radius.lg,
    backgroundColor: palette.white,
  },
  cardChecked: {
    borderColor: palette.cobalt600,
    backgroundColor: palette.cobalt50,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: palette.stone300,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotChecked: { borderColor: palette.cobalt600 },
  inner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.cobalt600,
  },
  body: { flex: 1 },
  label: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '500',
    color: palette.stone900,
  },
  sub: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: palette.stone500,
    marginTop: 2,
  },
});

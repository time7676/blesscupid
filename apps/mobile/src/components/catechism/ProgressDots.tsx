import { StyleSheet, View } from 'react-native';
import { palette, radius } from '../../theme/tokens.js';

interface Props {
  current: number; // 1-indexed
  total: number;
  accessibilityLabel?: string;
}

export function ProgressDots({ current, total, accessibilityLabel }: Props) {
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ now: current, min: 1, max: total }}
    >
      {Array.from({ length: total }, (_unused, i) => (
        <View
          key={i}
          style={[styles.dot, i < current ? styles.filled : styles.unfilled]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  dot: {
    width: 32,
    height: 4,
    borderRadius: radius.sm / 3,
  },
  filled: { backgroundColor: palette.cobalt600 },
  unfilled: { backgroundColor: palette.cream300 },
});

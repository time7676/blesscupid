import { StyleSheet, View } from 'react-native';
import { color, radius, space } from '../tokens.js';

export type ProgressDotsProps = {
  current: number;
  total: number;
  ariaLabel?: string;
};

export function ProgressDots({ current, total, ariaLabel }: ProgressDotsProps) {
  const label = ariaLabel ?? `Langkah ${current} dari ${total}`;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 1, max: total, now: current }}
      style={styles.row}
    >
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < current;
        return <View key={i} style={[styles.dot, filled ? styles.dotFilled : null]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.s1,
    justifyContent: 'center',
    paddingVertical: space.s2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: color.hairline.default,
  },
  dotFilled: {
    // v1.1 — amber, not blue
    backgroundColor: color.warning[700],
  },
});

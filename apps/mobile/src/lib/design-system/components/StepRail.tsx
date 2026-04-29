import { StyleSheet, Text, View } from 'react-native';
import { border, color, fontFamily, fontSize, letterSpacingFor, space, tracking } from '../tokens.js';

export type StepRailProps = {
  current: number;
  total: number;
  eyebrow?: string;
};

export function StepRail({ current, total, eyebrow }: StepRailProps) {
  const safeTotal = Math.max(1, total);
  const safeCurrent = Math.min(Math.max(1, current), safeTotal);
  const percent = (safeCurrent / safeTotal) * 100;

  return (
    <View style={styles.wrapper}>
      <View style={styles.rail}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.eyebrow} accessibilityRole="header">
        {`Step ${safeCurrent} of ${safeTotal}${eyebrow ? ` — ${eyebrow}` : ''}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: space.s7,
  },
  rail: {
    height: border.thick,
    marginHorizontal: space.s6,
    backgroundColor: color.hairline.default,
    borderRadius: 1,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: color.gold.default,
    borderRadius: 1,
  },
  eyebrow: {
    paddingTop: space.s7,
    paddingHorizontal: space.s7,
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.eyebrow,
    letterSpacing: letterSpacingFor(tracking.eyebrow, fontSize.eyebrow),
    color: color.ink.soft,
    textTransform: 'uppercase',
  },
});

import type { ReactNode } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useEffect, useState } from 'react';
import { palette, spacing } from '../../theme/tokens.js';

interface Props {
  height?: number;
  showWordmark?: boolean;
  wordmark?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/**
 * Morning-light hero — cream → gold-100 with single sun glow.
 * Constraint 1: NO illustrated angels/doves/clouds. Sun glow only.
 * Constraint 7: sun hidden under prefers-reduced-motion.
 */
export function MorningHero({ height = 388, showWordmark = false, wordmark, style, children }: Props) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (!cancelled) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  return (
    <View style={[styles.hero, { height }, style]}>
      <View style={styles.gradient} />
      {!reduced ? <View style={styles.sun} /> : null}
      <View style={styles.horizon} />
      {showWordmark && wordmark ? (
        <Text style={styles.wordmark}>
          {wordmark.slice(0, 8)}
          <Text style={styles.dot}>·</Text>
          {wordmark.slice(8)}
        </Text>
      ) : null}
      {children ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    backgroundColor: palette.gold100,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.s7,
    paddingBottom: spacing.s8,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.cream50,
    opacity: 0.3,
  },
  sun: {
    position: 'absolute',
    top: 76,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.gold500,
    opacity: 0.35,
  },
  horizon: {
    position: 'absolute',
    left: spacing.s7,
    right: spacing.s7,
    bottom: spacing.s8,
    height: 1,
    backgroundColor: palette.gold300,
    opacity: 0.6,
  },
  wordmark: {
    fontFamily: 'Source Serif 4',
    fontSize: 36,
    fontWeight: '500',
    color: palette.cobalt900,
    letterSpacing: -0.18,
  },
  dot: {
    color: palette.gold500,
    fontSize: 36,
  },
  content: { width: '100%' },
});

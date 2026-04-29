import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { color, fontFamily, fontSize, radius, space } from '../tokens.js';

/**
 * LoadingState — three variants for "we're fetching" moments.
 *
 *  - 'screen'   full-screen centered spinner with optional caption
 *  - 'skeleton' shimmering placeholder rectangles, sized via props
 *  - 'inline'   small spinner you can drop next to any other content
 *
 * Submit-busy is a button concern, not a loading-state concern — keep that
 * inside Button via the existing `loading` prop.
 */

export type ScreenLoadingProps = {
  caption?: string;
};

export function ScreenLoading({ caption }: ScreenLoadingProps) {
  return (
    <View style={styles.screen}>
      <ActivityIndicator size="large" color={color.warning[700]} />
      {caption !== undefined && <Text style={styles.caption}>{caption}</Text>}
    </View>
  );
}

export type InlineLoadingProps = {
  small?: boolean;
};

export function InlineLoading({ small }: InlineLoadingProps) {
  return <ActivityIndicator size={small ? 'small' : 'small'} color={color.ink.soft} />;
}

export type SkeletonProps = {
  /** Width in points or a percent string. */
  width?: number | string;
  /** Height in points. Default 14 (one line of body). */
  height?: number;
  /** Border radius. Default `radius.sm`. */
  rounded?: keyof typeof radius;
  style?: ViewStyle;
};

/**
 * Skeleton — single shimmering rectangle. Compose to build whole screens.
 * Uses Animated.Value with a parallel pulse from 0.5 → 1.0 opacity, 1.4s loop.
 */
export function Skeleton({ width = '100%', height = 14, rounded = 'sm', style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius[rounded],
          backgroundColor: color.sandstone.deep,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * SkeletonCard — Today profile card placeholder. ~88pt portrait + 3 lines.
 * Used during the initial Today fetch, paywall data load, etc.
 */
export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton width={88} height={112} rounded="md" />
      <View style={styles.cardBody}>
        <Skeleton width="60%" height={18} />
        <Skeleton width="40%" height={12} style={{ marginTop: space.s2 }} />
        <View style={styles.chipRow}>
          <Skeleton width={64} height={18} rounded="pill" />
          <Skeleton width={80} height={18} rounded="pill" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s4,
    paddingHorizontal: space.s7,
  },
  caption: {
    marginTop: space.s4,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.ink.soft,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    gap: space.s4,
    padding: space.s4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.hairline.soft,
    backgroundColor: color.parchment.raised,
  },
  cardBody: { flex: 1, justifyContent: 'space-between' },
  chipRow: { flexDirection: 'row', gap: space.s2, marginTop: space.s3 },
});

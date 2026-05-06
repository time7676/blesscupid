import { useEffect } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { color, radius, space } from '../tokens.js';
import { haptic } from '../haptics.js';

export type ActionDeckProps = {
  onPass: () => void;
  onBless: () => void;
  onSuper: () => void;
  /** Disable all buttons (during card animation OR on interlude top). */
  disabled?: boolean;
};

/**
 * ActionDeck — three buttons matching swipe direction semantics.
 *   Left  56pt = Pass     ← swipe left
 *   Mid   80pt = Super    ↑ swipe up (rare, sacred, dramatic gold)
 *   Right 56pt = Bless    → swipe right (primary affirmative, cobalt)
 *
 * Mid icon is the visual ceremony — gold-themed because Super-Bless is the
 * sacred / rare action. Bless stays cobalt-500 (CTA) but smaller because the
 * gesture itself does the heavy lifting on the right side.
 */

// Pass = chevron-left + X (left direction)
function PassIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color.ink.soft} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

// Super = star with up-flourish (elevated / sacred)
function SuperIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5l2.6 6.2 6.7.55-5.1 4.6 1.55 6.65L12 17l-5.75 3.5L7.8 13.85 2.7 9.25l6.7-.55z"
        stroke={color.gold.default}
        strokeWidth={1.7}
        strokeLinejoin="round"
        fill="rgba(200,162,75,0.22)"
      />
    </Svg>
  );
}

// Bless = open palm raised (priestly blessing gesture, right swipe)
function BlessIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11M12 11V4.5a1.5 1.5 0 0 1 3 0V11M15 11V5.5a1.5 1.5 0 0 1 3 0V13M9 11V8.5a1.5 1.5 0 0 0-3 0v6.5c0 3.5 2.5 6 6 6h1.5c3 0 5.5-2 5.5-5.5V13"
        stroke={color.parchment.raised}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ActionDeck({ onPass, onBless, onSuper, disabled = false }: ActionDeckProps) {
  // Super breathing inner glow (3.6s cycle) — the sacred halo lives on Super now.
  const breath = useSharedValue(0.4);
  useEffect(() => {
    breath.value = withRepeat(
      withSequence(
        withTiming(0.95, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(breath);
  }, [breath]);
  const breathStyle = useAnimatedStyle(() => ({ opacity: breath.value }));

  const press = (kind: 'pass' | 'bless' | 'super') => {
    void haptic('press');
    if (kind === 'pass') onPass();
    else if (kind === 'bless') onBless();
    else onSuper();
  };

  return (
    <View style={styles.row} pointerEvents={disabled ? 'none' : 'auto'}>
      <Pressable
        onPress={() => press('pass')}
        accessibilityRole="button"
        accessibilityLabel="Pass — swipe left"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={({ pressed }) => [
          styles.btn,
          styles.btnSide,
          { transform: [{ scale: pressed ? 0.94 : 1 }] },
        ]}
      >
        <PassIcon />
      </Pressable>

      <Pressable
        onPress={() => press('super')}
        accessibilityRole="button"
        accessibilityLabel="Super-Bless — swipe up"
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        style={({ pressed }) => [
          styles.btn,
          styles.btnSuper,
          { transform: [{ scale: pressed ? 0.94 : 1 }] },
        ]}
      >
        <Animated.View style={[styles.superGlow, breathStyle]} pointerEvents="none" />
        <SuperIcon />
      </Pressable>

      <Pressable
        onPress={() => press('bless')}
        accessibilityRole="button"
        accessibilityLabel="Send Bless — swipe right"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={({ pressed }) => [
          styles.btn,
          styles.btnBless,
          { transform: [{ scale: pressed ? 0.94 : 1 }] },
        ]}
      >
        <BlessIcon />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s7 - 4, // 28pt
    paddingVertical: space.s4,
  } as ViewStyle,
  btn: {
    borderRadius: radius.pill,
    backgroundColor: color.parchment.raised,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#14181F',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  btnSide: {
    width: 56,
    height: 56,
    borderWidth: 1.5,
    borderColor: color.hairline.default,
  },
  // Super (mid) — sacred ceremony, gold-themed.
  btnSuper: {
    width: 80,
    height: 80,
    backgroundColor: color.parchment.raised,
    borderWidth: 2,
    borderColor: color.gold.default,
    shadowColor: color.gold.default,
    shadowOpacity: 0.32,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  superGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(229,201,125,0.22)',
  } as ViewStyle,
  // Bless (right) — primary affirmative, cobalt CTA, smaller.
  btnBless: {
    width: 56,
    height: 56,
    backgroundColor: color.cobalt[500],
    borderWidth: 1.5,
    borderColor: color.cobalt[500],
    shadowColor: color.cobalt[700],
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});

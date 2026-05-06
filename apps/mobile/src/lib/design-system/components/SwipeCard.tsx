import { ReactNode, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { color, fontFamily, fontSize, letterSpacingFor, radius, space, tracking } from '../tokens.js';
import { DURATION, EASING, GESTURE, STACK, SWIPE } from '../motion.js';
import { haptic } from '../haptics.js';

export type SwipeAction = 'pass' | 'bless' | 'super';

const SCREEN = Dimensions.get('window');
const CARD_W = SCREEN.width - space.s7 * 2;
const CARD_H = SCREEN.height * 0.58;

const EXIT_FRACTION = 1.4; // how far card flies on commit

const TIMING_INTENT = { duration: DURATION.intent, easing: Easing.bezier(0.2, 0.7, 0.2, 1) };
const TIMING_GENTLE = { duration: DURATION.gentle, easing: Easing.bezier(0.4, 0, 0.2, 1) };

export type SwipeCardProps = {
  isTop: boolean;
  stackIndex: 0 | 1 | 2;
  /** Called when this card commits (top card only). */
  onCommit?: (action: SwipeAction) => void;
  /** Called when user taps this card (top card only, drag < 8pt, release < 120ms). */
  onPeek?: () => void;
  /** Whether overlays should render. Verse interlude cards pass false. */
  showOverlays?: boolean;
  /** Disable gestures (e.g., while parent sheet is open or another card animating). */
  locked?: boolean;
  children: ReactNode;
};

const stackPose = (idx: 0 | 1 | 2) => {
  if (idx === 0) return STACK.top;
  if (idx === 1) return STACK.behind1;
  return STACK.behind2;
};

export function SwipeCard({
  isTop,
  stackIndex,
  onCommit,
  onPeek,
  showOverlays = true,
  locked = false,
  children,
}: SwipeCardProps) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(1);
  const pose = stackPose(stackIndex);
  const scale = useSharedValue(pose.scale);
  const baseY = useSharedValue(pose.translateY);
  const baseOpacity = useSharedValue(pose.opacity);

  // When stackIndex changes (deck restock), animate to new resting pose.
  useEffect(() => {
    const next = stackPose(stackIndex);
    scale.value = withTiming(next.scale, TIMING_GENTLE);
    baseY.value = withTiming(next.translateY, TIMING_GENTLE);
    baseOpacity.value = withTiming(next.opacity, TIMING_GENTLE);
  }, [stackIndex, scale, baseY, baseOpacity]);

  const finishCommit = (action: SwipeAction) => {
    onCommit?.(action);
  };

  const fireHapticPress = () => {
    void haptic('press');
  };
  const fireHapticThreshold = () => {
    void haptic('threshold');
  };
  const fireHapticCommit = (a: SwipeAction) => {
    void haptic(a === 'super' ? 'super' : 'commit');
  };

  const reachedThreshold = useSharedValue(false);

  const pan = Gesture.Pan()
    .enabled(isTop && !locked)
    .activeOffsetX([-GESTURE.tapMaxDriftPx, GESTURE.tapMaxDriftPx])
    .activeOffsetY([-GESTURE.tapMaxDriftPx, GESTURE.tapMaxDriftPx])
    .onBegin(() => {
      cancelAnimation(x);
      cancelAnimation(y);
      reachedThreshold.value = false;
      runOnJS(fireHapticPress)();
    })
    .onUpdate((e) => {
      const dx = e.translationX;
      const dy = e.translationY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      // Axis lock — once chosen, ignore other axis.
      if (absX > absY) {
        x.value = dx;
        y.value = 0;
      } else {
        // Vertical only allowed upward (up = super). Down = noop.
        x.value = 0;
        y.value = dy < 0 ? dy : 0;
      }
      // Threshold haptic fires once when first crossed.
      const xFrac = absX / CARD_W;
      const yFrac = Math.abs(y.value) / CARD_H;
      const crossed =
        xFrac >= SWIPE.horizontalDistanceFraction || yFrac >= SWIPE.verticalDistanceFraction;
      if (crossed && !reachedThreshold.value) {
        reachedThreshold.value = true;
        runOnJS(fireHapticThreshold)();
      } else if (!crossed && reachedThreshold.value) {
        reachedThreshold.value = false;
      }
    })
    .onEnd((e) => {
      const dx = x.value;
      const dy = y.value;
      const vx = e.velocityX;
      const vy = e.velocityY;
      const xFrac = Math.abs(dx) / CARD_W;
      const yFrac = Math.abs(dy) / CARD_H;
      const flickX = Math.abs(vx) > SWIPE.flickVelocity;
      const flickY = Math.abs(vy) > SWIPE.flickVelocity;

      let action: SwipeAction | null = null;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (xFrac >= SWIPE.horizontalDistanceFraction || flickX) {
          action = dx > 0 ? 'bless' : 'pass';
        }
      } else if (dy < 0 && (yFrac >= SWIPE.verticalDistanceFraction || flickY)) {
        action = 'super';
      }

      if (action) {
        const a = action;
        runOnJS(fireHapticCommit)(a);
        if (a === 'pass') {
          x.value = withTiming(-CARD_W * EXIT_FRACTION, TIMING_INTENT);
        } else if (a === 'bless') {
          x.value = withTiming(CARD_W * EXIT_FRACTION, TIMING_INTENT);
        } else {
          y.value = withTiming(-CARD_H * EXIT_FRACTION, TIMING_INTENT);
        }
        opacity.value = withTiming(0.6, TIMING_INTENT, () => {
          runOnJS(finishCommit)(a);
        });
      } else {
        // snap back
        x.value = withTiming(0, TIMING_INTENT);
        y.value = withTiming(0, TIMING_INTENT);
      }
    });

  const tap = Gesture.Tap()
    .enabled(isTop && !locked)
    .maxDuration(GESTURE.tapMaxDurationMs)
    .maxDistance(GESTURE.tapMaxDriftPx)
    .onEnd(() => {
      if (onPeek) runOnJS(onPeek)();
    });

  const longPress = Gesture.LongPress()
    .enabled(isTop && !locked)
    .minDuration(GESTURE.longPressMs)
    .maxDistance(GESTURE.tapMaxDriftPx)
    .onStart(() => {
      runOnJS(fireHapticThreshold)();
      if (onPeek) runOnJS(onPeek)();
    });

  const composed = Gesture.Race(pan, longPress, tap);

  const animatedStyle = useAnimatedStyle(() => {
    const rot = (x.value / CARD_W) * SWIPE.rotationCapDegrees;
    return {
      transform: [
        { translateX: x.value },
        { translateY: y.value + baseY.value },
        { scale: scale.value },
        { rotate: `${rot}deg` },
      ],
      opacity: opacity.value * baseOpacity.value,
      zIndex: 10 - stackIndex,
    };
  });

  const passOverlayStyle = useAnimatedStyle(() => {
    const o = interpolate(
      x.value,
      [-CARD_W * SWIPE.overlayFullFraction, -CARD_W * SWIPE.overlayStartFraction, 0],
      [1, 0, 0],
      'clamp',
    );
    return { opacity: o };
  });
  const blessOverlayStyle = useAnimatedStyle(() => {
    const o = interpolate(
      x.value,
      [0, CARD_W * SWIPE.overlayStartFraction, CARD_W * SWIPE.overlayFullFraction],
      [0, 0, 1],
      'clamp',
    );
    return { opacity: o };
  });
  const superOverlayStyle = useAnimatedStyle(() => {
    const o = interpolate(
      y.value,
      [-CARD_H * SWIPE.overlayFullFraction, -CARD_H * SWIPE.overlayStartFraction, 0],
      [1, 0, 0],
      'clamp',
    );
    return { opacity: o };
  });

  const cardContent = (
    <Animated.View style={[styles.card, animatedStyle]}>
      {showOverlays && (
        <>
          <Animated.View style={[styles.overlay, styles.overlayPass, passOverlayStyle]}>
            <Text style={styles.overlayText}>Pass</Text>
          </Animated.View>
          <Animated.View style={[styles.overlay, styles.overlayBless, blessOverlayStyle]}>
            <Text style={[styles.overlayText, styles.overlayTextBless]}>Bless</Text>
          </Animated.View>
          <Animated.View style={[styles.overlay, styles.overlaySuper, superOverlayStyle]}>
            <Text style={[styles.overlayText, styles.overlayTextSuper]}>Super-Bless</Text>
          </Animated.View>
        </>
      )}
      {children}
    </Animated.View>
  );

  if (!isTop) {
    return cardContent;
  }
  return <GestureDetector gesture={composed}>{cardContent}</GestureDetector>;
}

// Imperative commit (used by ActionDeck button taps).
// SwipeDeck owns the active card and drives this.
export type CardCommit = (action: SwipeAction) => void;

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.xxl,
    backgroundColor: color.parchment.raised,
    overflow: 'hidden',
    shadowColor: '#14181F',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  } as ViewStyle,
  overlay: {
    position: 'absolute',
    top: space.s6,
    paddingHorizontal: space.s4,
    paddingVertical: space.s2,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    zIndex: 5,
  } as ViewStyle,
  overlayPass: {
    right: space.s6,
    borderColor: color.ink.soft,
  } as ViewStyle,
  overlayBless: {
    left: space.s6,
    borderColor: color.cobalt[700],
    backgroundColor: 'rgba(200,162,75,0.18)',
  } as ViewStyle,
  overlaySuper: {
    top: '60%',
    alignSelf: 'center',
    borderColor: color.gold.default,
    transform: [{ rotate: '-8deg' }],
  } as ViewStyle,
  overlayText: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.label,
    letterSpacing: letterSpacingFor(tracking.eyebrow, fontSize.label),
    textTransform: 'uppercase',
    color: color.ink.soft,
  },
  overlayTextBless: { color: color.cobalt[700] },
  overlayTextSuper: { color: color.gold.default },
});

export const CARD_DIMENSIONS = { width: CARD_W, height: CARD_H } as const;

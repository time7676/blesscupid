// Motion primitives — shared animation constants for Cathedral Light v1.1.
// Source-of-truth: docs/design/system-v1/swipe-experience.html
// Banned: spring overshoot, confetti, hearts-fly, scale-pop on match.

import { Easing } from 'react-native';

export const DURATION = {
  instant: 80,
  gentle: 200,
  intent: 320,
  ceremony: 560,
} as const;

export const EASING = {
  standard: Easing.bezier(0.4, 0.0, 0.2, 1),
  emphatic: Easing.bezier(0.2, 0.7, 0.2, 1),
  linear: Easing.linear,
} as const;

// Swipe-specific thresholds. See swipe-experience.html §02.
export const SWIPE = {
  horizontalDistanceFraction: 0.32, // 32% of card width OR
  verticalDistanceFraction: 0.22, // 22% of card height OR
  flickVelocity: 800, // px/s
  axisLockDistance: 12, // px before axis chooses
  rotationCapDegrees: 18,
  overlayStartFraction: 0.08, // overlay opacity ramp begins
  overlayFullFraction: 0.28, // overlay fully visible
} as const;

// Stack visual state. See swipe-flow.html §01.
export const STACK = {
  top: { scale: 1, translateY: 0, opacity: 1 },
  behind1: { scale: 0.94, translateY: 12, opacity: 0.7 },
  behind2: { scale: 0.88, translateY: 24, opacity: 0.4 },
  offDeck: { scale: 0.82, translateY: 36, opacity: 0 },
} as const;

// Tap vs drag vs long-press timing. See swipe-flow.html §03.
export const GESTURE = {
  tapMaxDurationMs: 120,
  longPressMs: 240,
  tapMaxDriftPx: 8,
} as const;

// Verse interlude pacing. See swipe-flow.html §03b.
export const INTERLUDE_EVERY_N_SWIPES = 5;

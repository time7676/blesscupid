// Design tokens — BlessCupid system v1.1 (Garden Hours).
// Mirrors docs/design/system-v1/tokens.css, adapted for React Native:
// - px values become unitless numbers (RN units are points)
// - letterSpacing converts em → points relative to a 16-pt base
// - font families resolve to the names registered via expo-google-fonts
// - motion exposes Easing + duration constants instead of CSS transitions
//
// v1.1 deltas vs v0 (see docs/design/system-v1/README.md):
// - cobalt ramp added (defined but reserved for future secondary states; not
//   used in user-facing surfaces in v1.1)
// - feedback.warning (single token) → warning.{100,500,700} amber ramp
// - feedback.success (single token) → success.{100,500,700} sage ramp
// - radius.xl (20) + radius.xxl (28) added
// - space.s11 (56) added
// - elevation.card added
// - color.indigo retained as a deprecated alias to color.cobalt[700]

import { Easing } from 'react-native';

export const color = {
  ink: {
    default: '#1A1A24',
    soft: '#3F3F4A',
    charcoal: '#14181F',
    hover: '#2A2A36',
    pressed: '#0F0F15',
  },
  parchment: {
    default: '#FAF7F0',
    raised: '#FFFDF7',
    off: '#F8F8F4',
  },
  sandstone: {
    default: '#F4ECDF',
    deep: '#EFE4D2',
    warm: '#FBF3E2',
  },
  gold: {
    default: '#C8A24B',
    soft: '#E5C97D',
    halo: 'rgba(200, 162, 75, 0.18)',
  },
  // v1.1 — full cobalt ramp. Defined but RESERVED for future secondary states;
  // user-facing surfaces use the warning (amber) ramp instead. See README.
  cobalt: {
    50: '#EEF2FB',
    100: '#D6E0F4',
    300: '#7FA1DD',
    500: '#3D67B8',
    700: '#243F7A',
    900: '#142447',
  },
  // v1.1 — warning is amber, never red. Holy Code §HCoC bans red.
  warning: {
    100: '#FCEBD2',
    500: '#D08A2C',
    700: '#8C5912',
  },
  // v1.1 — success is sage, not green-green.
  success: {
    100: '#E5EFE6',
    500: '#5C8A6A',
    700: '#3F6149',
  },
  hairline: {
    default: 'rgba(26, 26, 36, 0.12)',
    soft: 'rgba(26, 26, 36, 0.06)',
    strong: 'rgba(20, 24, 31, 0.16)',
  },
  /** @deprecated v1.1 — use color.cobalt[700] for the cool-blue accent. */
  indigo: {
    default: '#243F7A',
  },
  /** @deprecated v1.1 — use color.warning.* and color.success.* ramps. */
  feedback: {
    warning: '#8C5912',
    warningTint: 'rgba(140, 89, 18, 0.14)',
    success: '#5C8A6A',
  },
} as const;

export const space = {
  s0: 0,
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s7: 32,
  s8: 40,
  s9: 56,
  s10: 72,
  s11: 56, // v1.1 — alias used by catechism legacy code; kept for migration
} as const;

export const radius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 12,
  xl: 20, // v1.1 — modal sheets, paywall cards
  xxl: 28, // v1.1 — hero cards (catechism legacy + future reading-room)
  pill: 999,
} as const;

export const border = {
  thin: 1,
  medium: 1.5,
  thick: 2,
} as const;

// Loaded via expo-google-fonts. Keys match the named exports
// (CormorantGaramond_400Regular etc) so we can wire a single fontFamily
// per text role and let weight/style tokens stay declarative.
export const fontFamily = {
  serif: 'CormorantGaramond_400Regular',
  serifMedium: 'CormorantGaramond_500Medium',
  serifSemibold: 'CormorantGaramond_600SemiBold',
  serifItalic: 'CormorantGaramond_400Regular_Italic',
  serifMediumItalic: 'CormorantGaramond_500Medium_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemibold: 'Inter_600SemiBold',
} as const;

export const fontFallback = {
  serif: ['Georgia', 'Times New Roman', 'serif'],
  sans: ['System', '-apple-system', 'sans-serif'],
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
} as const;

export const fontSize = {
  hero: 38,
  h2: 26,
  h3: 22,
  body: 14,
  bodyLg: 16,
  label: 13,
  caption: 12.5,
  eyebrow: 11,
} as const;

export const lineHeight = {
  hero: Math.round(38 * 1.04),
  h2: Math.round(26 * 1.18),
  h3: Math.round(22 * 1.35),
  body: Math.round(14 * 1.55),
  bodyLg: Math.round(16 * 1.55),
  tight: Math.round(16 * 1.25),
} as const;

// Letter spacing in RN is points, so em values are scaled to the relevant
// font size at usage sites. We store the em ratio here for callers to apply.
export const tracking = {
  tight: -0.012,
  normal: 0,
  label: 0.02,
  eyebrow: 0.2,
} as const;

export function letterSpacingFor(em: number, sizePx: number): number {
  return em * sizePx;
}

// Type presets — composable styles for the eight roles named in tokens.md §2.
// Use spread to apply, then layer color/text-align as needed.
export const type = {
  hero: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.hero,
    lineHeight: lineHeight.hero,
    letterSpacing: letterSpacingFor(tracking.tight, fontSize.hero),
  },
  h2: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h2,
    lineHeight: lineHeight.h2,
    letterSpacing: letterSpacingFor(tracking.tight, fontSize.h2),
  },
  h3: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h3,
    lineHeight: lineHeight.h3,
    letterSpacing: 0,
  },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    letterSpacing: 0,
  },
  bodyLg: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodyLg,
    lineHeight: lineHeight.bodyLg,
    letterSpacing: 0,
  },
  label: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.label,
    lineHeight: Math.round(fontSize.label * 1.4),
    letterSpacing: letterSpacingFor(tracking.label, fontSize.label),
  },
  caption: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    lineHeight: Math.round(fontSize.caption * 1.55),
    letterSpacing: 0,
  },
  eyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.eyebrow,
    lineHeight: Math.round(fontSize.eyebrow * 1.4),
    letterSpacing: letterSpacingFor(tracking.eyebrow, fontSize.eyebrow),
    textTransform: 'uppercase' as const,
  },
} as const;

export const motion = {
  duration: {
    instant: 80,
    gentle: 200,
    intent: 320,
    ceremony: 560,
  },
  easing: {
    standard: Easing.bezier(0.4, 0.0, 0.2, 1),
    emphatic: Easing.bezier(0.2, 0.7, 0.2, 1),
    linear: Easing.linear,
  },
  preset: {
    gentle: { duration: 200, easing: Easing.bezier(0.4, 0.0, 0.2, 1) },
    intent: { duration: 320, easing: Easing.bezier(0.2, 0.7, 0.2, 1) },
    ceremony: { duration: 560, easing: Easing.bezier(0.2, 0.7, 0.2, 1) },
  },
} as const;

export const elevation = {
  none: {},
  raise: {
    shadowColor: '#1A1A24',
    shadowOpacity: 0.04,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  // v1.1 — soft card shadow for ListItem rows, profile cards, plan-tier row.
  card: {
    shadowColor: '#14181F',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  modal: {
    shadowColor: '#14181F',
    shadowOpacity: 0.18,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
} as const;

export const theme = {
  color,
  space,
  radius,
  border,
  fontFamily,
  fontFallback,
  fontWeight,
  fontSize,
  lineHeight,
  tracking,
  type,
  motion,
  elevation,
} as const;

export type Theme = typeof theme;

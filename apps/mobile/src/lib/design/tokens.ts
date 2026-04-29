// BLE-100: typed design tokens for React Native consumers.
// Mirrors docs/design/system-v0/tokens.json (Cathedral Light v0).
// Promote any new hex/values into tokens.json first, then re-export here.

export const color = {
  ink: {
    default: '#1A1A24',
    soft: '#3F3F4A',
    charcoal: '#14181F',
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
  indigo: {
    default: '#2A3470',
  },
  hairline: {
    default: 'rgba(26, 26, 36, 0.12)',
    soft: 'rgba(26, 26, 36, 0.06)',
    strong: 'rgba(20, 24, 31, 0.16)',
  },
  feedback: {
    warning: '#A95837',
    success: '#5C7A56',
  },
  inverse: '#FFFDF7',
} as const;

export const font = {
  family: {
    serif: 'Cormorant Garamond',
    sans: 'Inter',
  },
  weight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
  },
  size: {
    hero: 38,
    h2: 26,
    h3: 22,
    body: 14,
    bodyLg: 16,
    label: 13,
    caption: 12.5,
    eyebrow: 11,
  },
  lineHeight: {
    hero: 40,
    h2: 31,
    h3: 30,
    body: 22,
    tight: 18,
    scripture: 28,
  },
  tracking: {
    tight: -0.45,
    normal: 0,
    label: 0.28,
    eyebrow: 2.2,
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
} as const;

export const radius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 12,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export const border = {
  thin: 1,
  medium: 1.5,
  thick: 2,
} as const;

// Motion durations are ms. BLE-84 §1 calls for `duration-fast` opacity
// crossfade on the translation toggle — mapped to Cathedral Light `instant`
// (80ms) to keep the swap below conscious notice.
export const motion = {
  duration: {
    fast: 80,
    gentle: 200,
    intent: 320,
    ceremony: 560,
  },
} as const;

// Minimum touch-target floor (Apple HIG / Material).
export const a11y = {
  touchTargetMin: 44,
} as const;

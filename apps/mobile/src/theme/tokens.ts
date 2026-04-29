/**
 * Design tokens — BlessCupid v0.1.
 * Mirrors `tokens.css` from BLE-22 / BLE-106. RN consumers must reference
 * these tokens, not raw hex.
 */

export const palette = {
  cream50: '#FDFBF6',
  cream100: '#F8F2E6',
  cream200: '#EFE6D2',
  cream300: '#E2D4B5',

  cobalt50: '#EEF2FB',
  cobalt100: '#D6E0F4',
  cobalt300: '#7FA1DD',
  cobalt500: '#3D67B8',
  cobalt600: '#2F4F99',
  cobalt700: '#243F7A',
  cobalt900: '#142447',

  gold100: '#FBF1D7',
  gold300: '#E9C780',
  gold500: '#C99A3A',
  gold700: '#8C6822',

  sage100: '#E5EFE6',
  sage500: '#5C8A6A',
  sage700: '#3F6149',

  amber100: '#FCEBD2',
  amber500: '#D08A2C',
  amber700: '#8C5912',

  stone50: '#FAF8F4',
  stone100: '#EFEAE0',
  stone300: '#C8BFAF',
  stone500: '#867C6A',
  stone700: '#4A4338',
  stone900: '#221F18',

  white: '#FFFFFF',
} as const;

export const semantic = {
  bgCanvas: palette.cream50,
  bgSurface: palette.white,
  bgRaised: palette.cream100,
  bgSunken: palette.cream200,

  textPrimary: palette.stone900,
  textSecondary: palette.stone700,
  textTertiary: palette.stone500,
  textInverse: palette.cream50,
  textScripture: palette.cobalt900,
  textBrand: palette.cobalt600,

  borderSubtle: palette.cream300,
  borderStrong: palette.stone300,
  borderFocus: palette.cobalt600,

  stateSuccess: palette.sage500,
  stateWarning: palette.amber500,
  stateCritical: palette.amber700, // never red — Holy Code
  accentGold: palette.gold500,
} as const;

export const fonts = {
  display: 'Source Serif 4',
  body: 'Inter',
} as const;

export const type = {
  display2xl: { fontSize: 48, lineHeight: 52, fontWeight: '500' as const, fontFamily: fonts.display },
  displayXl: { fontSize: 36, lineHeight: 42, fontWeight: '500' as const, fontFamily: fonts.display },
  displayLg: { fontSize: 28, lineHeight: 34, fontWeight: '500' as const, fontFamily: fonts.display },
  headingLg: { fontSize: 22, lineHeight: 28, fontWeight: '500' as const, fontFamily: fonts.display },
  headingMd: { fontSize: 18, lineHeight: 24, fontWeight: '500' as const, fontFamily: fonts.display },
  bodyLg: { fontSize: 17, lineHeight: 26, fontWeight: '400' as const, fontFamily: fonts.body },
  bodyMd: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const, fontFamily: fonts.body },
  bodySm: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const, fontFamily: fonts.body },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, fontFamily: fonts.body },
} as const;

export const spacing = {
  s0: 0,
  s1: 2,
  s2: 4,
  s3: 8,
  s4: 12,
  s5: 16,
  s6: 20,
  s7: 24,
  s8: 32,
  s9: 40,
  s10: 48,
  s11: 64,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export const elevation = {
  level1: {
    shadowColor: '#142428',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  level2: {
    shadowColor: '#142428',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const;

export const tokens = {
  palette,
  semantic,
  fonts,
  type,
  spacing,
  radius,
  elevation,
} as const;

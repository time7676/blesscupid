/**
 * Self-contained mirror of BLE-22 design tokens v0.1
 * (/BLE/issues/BLE-22#document-tokens).
 *
 * This file exists so the scaffold compiles in isolation. When the
 * `@blesscupid/design-system` package ships a JS export (currently CSS-only),
 * delete this file and update imports back to:
 *
 *   import { tokens } from '@blesscupid/design-system';
 *
 * Token names match the canonical BLE-22 naming exactly. Hex values mirror
 * `ble-23-onboarding/tokens.css`.
 */

export const tokens = {
  color: {
    cream: {
      50: '#FDFBF6',
      100: '#F8F2E6',
      200: '#EFE6D2',
      300: '#E2D4B5',
    },
    cobalt: {
      50: '#EEF2FB',
      100: '#D6E0F4',
      300: '#7FA1DD',
      500: '#3D67B8',
      600: '#2F4F99',
      700: '#243F7A',
      900: '#142447',
    },
    gold: {
      100: '#FBF1D7',
      300: '#E9C780',
      500: '#C99A3A',
      700: '#8C6822',
    },
    sage: { 100: '#E5EFE6', 500: '#5C8A6A', 700: '#3F6149' },
    amber: { 100: '#FCEBD2', 500: '#D08A2C', 700: '#8C5912' },
    stone: {
      50: '#FAF8F4',
      100: '#EFEAE0',
      300: '#C8BFAF',
      500: '#867C6A',
      700: '#4A4338',
      900: '#221F18',
    },
    rose: { 300: '#E5A8B0', 500: '#C76A78' },

    bg: {
      canvas: '#FDFBF6',
      surface: '#FFFFFF',
      raised: '#F8F2E6',
      sunken: '#EFE6D2',
    },
    text: {
      primary: '#221F18',
      secondary: '#4A4338',
      tertiary: '#867C6A',
      inverse: '#FDFBF6',
      scripture: '#142447',
      brand: '#2F4F99',
    },
    border: { subtle: '#E2D4B5', strong: '#C8BFAF', focus: '#2F4F99' },
    state: {
      success: '#5C8A6A',
      warning: '#D08A2C',
      critical: '#8C5912', // amber-700, never red
    },
    accent: { gold: '#C99A3A', match: '#C76A78' },
  },

  font: {
    display:
      '"Source Serif 4", ui-serif, Georgia, serif',
    body: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
  },

  size: {
    display: { '2xl': 48, xl: 36, lg: 28 },
    heading: { lg: 22, md: 18, sm: 16 },
    body: { lg: 17, md: 15, sm: 13 },
    label: 12,
  },
  lineHeight: {
    display: { '2xl': 52, xl: 42, lg: 34 },
    heading: { lg: 28, md: 24, sm: 22 },
    body: { lg: 26, md: 22, sm: 18 },
    label: 16,
  },

  space: {
    0: 0,
    1: 2,
    2: 4,
    3: 8,
    4: 12,
    5: 16,
    6: 20,
    7: 24,
    8: 32,
    9: 40,
    10: 48,
    11: 64,
  },

  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    '2xl': 28,
    pill: 999,
  },

  duration: {
    instant: 0,
    fast: 120,
    base: 200,
    slow: 320,
    deliberate: 480,
  },

  easing: {
    standard: 'cubic-bezier(0.2, 0, 0.2, 1)',
    enter: 'cubic-bezier(0, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    reverent: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  z: {
    base: 0,
    raised: 10,
    dropdown: 100,
    sticky: 200,
    modal: 1000,
    toast: 1100,
    tooltip: 1200,
  },
} as const;

export type Tokens = typeof tokens;

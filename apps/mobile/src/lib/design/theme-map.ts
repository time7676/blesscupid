// BLE-100 §5: Theme → icon name + tag color map.
//
// Cathedral Light v0 is intentionally narrow — it does not yet ship the
// rose/sage/cobalt/stone/amber palette BLE-84 §5 references. We derive a
// tag-color from sandstone surfaces + ink-soft text so every theme renders
// without inventing un-tokened hex values. Icon names target Phosphor; the
// component substitutes a unicode glyph until `phosphor-react-native`
// installs (see TODO in VerseOfDayCard).
//
// Follow-up: BLE-22 v0.2 should add the multi-hue accent palette so each
// theme reads as visually distinct, then this map upgrades in place.

import type { VerseTheme } from '@blesscupid/shared';
import { color } from './tokens.js';

export type ThemeIconName =
  | 'heart-straight'
  | 'sun'
  | 'anchor'
  | 'mountains'
  | 'book-open'
  | 'users-three'
  | 'tree'
  | 'fingerprint'
  | 'lifebuoy'
  | 'link-simple'
  | 'praying-hands'
  | 'dove'
  | 'hand-heart';

export type ThemeStyle = {
  icon: ThemeIconName;
  glyph: string; // Unicode fallback while Phosphor isn't wired.
  tagBg: string;
  tagText: string;
  label: string; // ALL-CAPS label rendered in the pill.
};

// Tag-color tier: sandstone for warm themes, parchment-off for cool themes,
// gold-soft for celebratory themes. All readable on parchment background.
export const themeMap: Record<VerseTheme, ThemeStyle> = {
  love: {
    icon: 'heart-straight',
    glyph: '♡',
    tagBg: color.sandstone.warm,
    tagText: color.ink.soft,
    label: 'CINTA',
  },
  joy: {
    icon: 'sun',
    glyph: '☼',
    tagBg: color.gold.halo,
    tagText: color.ink.default,
    label: 'SUKACITA',
  },
  hope: {
    icon: 'anchor',
    glyph: '⚓',
    tagBg: color.parchment.off,
    tagText: color.indigo.default,
    label: 'HARAPAN',
  },
  faith: {
    icon: 'mountains',
    glyph: '⛰',
    tagBg: color.sandstone.default,
    tagText: color.ink.soft,
    label: 'IMAN',
  },
  wisdom: {
    icon: 'book-open',
    glyph: '\u{1F4D6}',
    tagBg: color.parchment.off,
    tagText: color.ink.soft,
    label: 'HIKMAT',
  },
  service: {
    icon: 'hand-heart',
    glyph: '\u{1F91D}',
    tagBg: color.sandstone.default,
    tagText: color.ink.soft,
    label: 'PELAYANAN',
  },
  community: {
    icon: 'users-three',
    glyph: '\u{1F46A}',
    tagBg: color.sandstone.default,
    tagText: color.ink.soft,
    label: 'KOMUNITAS',
  },
  identity: {
    icon: 'fingerprint',
    glyph: '✡',
    tagBg: color.gold.halo,
    tagText: color.ink.default,
    label: 'JATI DIRI',
  },
  peace: {
    icon: 'dove',
    glyph: '\u{1F54A}',
    tagBg: color.parchment.off,
    tagText: color.indigo.default,
    label: 'DAMAI',
  },
  marriage: {
    icon: 'link-simple',
    glyph: '\u{1F517}',
    tagBg: color.sandstone.warm,
    tagText: color.ink.soft,
    label: 'PERNIKAHAN',
  },
};

export function styleForTheme(theme: VerseTheme): ThemeStyle {
  return themeMap[theme];
}

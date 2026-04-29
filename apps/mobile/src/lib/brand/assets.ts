import type { ImageSourcePropType } from 'react-native';
import type { NavTabKey } from '../design-system/index.js';

export const brandLogos = {
  wordmarkPrimary: require('../../../assets/brand/logo/wordmark-primary.png'),
  wordmarkInverse: require('../../../assets/brand/logo/wordmark-inverse.png'),
  logoMark: require('../../../assets/brand/logo/logo-mark.png'),
  blessPlusWordmark: require('../../../assets/brand/logo/bless-plus-wordmark.png'),
};

export const heroArt = {
  welcome: require('../../../assets/brand/heroes/welcome-hero.png'),
  done: require('../../../assets/brand/heroes/done-hero.png'),
  datingOutOfScope: require('../../../assets/brand/heroes/dating-out-of-scope-hero.png'),
  oneTimeOfferBand: require('../../../assets/brand/heroes/one-time-offer-band.png'),
};

export const portraitPlaceholders = [
  require('../../../assets/brand/portraits/portrait-placeholder-1.png'),
  require('../../../assets/brand/portraits/portrait-placeholder-2.png'),
  require('../../../assets/brand/portraits/portrait-placeholder-3.png'),
  require('../../../assets/brand/portraits/portrait-placeholder-4.png'),
  require('../../../assets/brand/portraits/portrait-placeholder-5.png'),
  require('../../../assets/brand/portraits/portrait-placeholder-6.png'),
] as const satisfies readonly ImageSourcePropType[];

export const emptyStateArt = {
  today: require('../../../assets/brand/empty/today-empty.png'),
  people: require('../../../assets/brand/empty/people-empty.png'),
  threads: require('../../../assets/brand/empty/threads-empty.png'),
  search: require('../../../assets/brand/empty/search-empty.png'),
  offline: require('../../../assets/brand/empty/offline.png'),
  underConstruction: require('../../../assets/brand/empty/under-construction.png'),
};

export const errorStateArt = {
  network: require('../../../assets/brand/error/error-network.png'),
  server: require('../../../assets/brand/error/error-server.png'),
  unauthorized: require('../../../assets/brand/error/error-unauthorized.png'),
  faceDetect: require('../../../assets/brand/error/error-face-detect.png'),
  moderation: require('../../../assets/brand/error/error-moderation.png'),
};

export const verseCardBackgrounds = {
  morning: require('../../../assets/brand/verse/verse-card-bg-morning.png'),
  midday: require('../../../assets/brand/verse/verse-card-bg-midday.png'),
  evening: require('../../../assets/brand/verse/verse-card-bg-evening.png'),
};

export const bottomNavIcons = {
  today: {
    active: require('../../../assets/brand/nav/tab-today-active.png'),
    inactive: require('../../../assets/brand/nav/tab-today-inactive.png'),
  },
  people: {
    active: require('../../../assets/brand/nav/tab-people-active.png'),
    inactive: require('../../../assets/brand/nav/tab-people-inactive.png'),
  },
  threads: {
    active: require('../../../assets/brand/nav/tab-threads-active.png'),
    inactive: require('../../../assets/brand/nav/tab-threads-inactive.png'),
  },
  you: {
    active: require('../../../assets/brand/nav/tab-you-active.png'),
    inactive: require('../../../assets/brand/nav/tab-you-inactive.png'),
  },
} as const satisfies Record<NavTabKey, { active: ImageSourcePropType; inactive: ImageSourcePropType }>;

export const glyphs = {
  bell: require('../../../assets/brand/glyphs/bell.png'),
  block: require('../../../assets/brand/glyphs/block.png'),
  camera: require('../../../assets/brand/glyphs/camera.png'),
  chevronBack: require('../../../assets/brand/glyphs/chevron-back.png'),
  chevronDown: require('../../../assets/brand/glyphs/chevron-down.png'),
  chevronForward: require('../../../assets/brand/glyphs/chevron-forward.png'),
  close: require('../../../assets/brand/glyphs/close.png'),
  editPencil: require('../../../assets/brand/glyphs/edit-pencil.png'),
  gear: require('../../../assets/brand/glyphs/gear.png'),
  heartOutline: require('../../../assets/brand/glyphs/heart-outline.png'),
  infoCircle: require('../../../assets/brand/glyphs/info-circle.png'),
  lock: require('../../../assets/brand/glyphs/lock.png'),
  reportFlag: require('../../../assets/brand/glyphs/report-flag.png'),
  search: require('../../../assets/brand/glyphs/search.png'),
  shield: require('../../../assets/brand/glyphs/shield.png'),
  signOut: require('../../../assets/brand/glyphs/sign-out.png'),
} as const;

export type BrandGlyphName = keyof typeof glyphs;

export function bottomNavIconSource(tab: NavTabKey, active: boolean): ImageSourcePropType {
  return active ? bottomNavIcons[tab].active : bottomNavIcons[tab].inactive;
}

export function portraitSource(index: number): ImageSourcePropType {
  return portraitPlaceholders[((index % portraitPlaceholders.length) + portraitPlaceholders.length) % portraitPlaceholders.length];
}

export function glyphSource(name: BrandGlyphName): ImageSourcePropType {
  return glyphs[name];
}

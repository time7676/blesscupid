import type { ImageSourcePropType } from 'react-native';
import type { NavTabKey } from '../design-system/index.js';

export const brandLogos = {
  wordmarkPrimary: require('../../../assets/brand/logo/wordmark-primary.png'),
  wordmarkInverse: require('../../../assets/brand/logo/wordmark-inverse.png'),
  logoMark: require('../../../assets/brand/logo/logo-mark.png'),
  logoMarkInverse: require('../../../assets/brand/logo/logo-mark-inverse.png'),
  blessPlusWordmark: require('../../../assets/brand/logo/bless-plus-wordmark.png'),
};

export const appBrandAssets = {
  iconIos1024: require('../../../assets/brand/app-icon/app-icon-ios-1024.png'),
  androidAdaptiveForeground: require('../../../assets/brand/app-icon/android-adaptive-foreground.png'),
  androidAdaptiveBackground: require('../../../assets/brand/app-icon/android-adaptive-background.png'),
  notificationIconAndroid: require('../../../assets/brand/app-icon/notification-icon-android.png'),
  splash: require('../../../assets/brand/splash/splash.png'),
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

export const textureAssets = {
  parchmentGrain: require('../../../assets/brand/textures/parchment-grain.png'),
  goldRule: require('../../../assets/brand/textures/gold-rule.png'),
};

export const traditionBadgeIcons = {
  catholic: require('../../../assets/brand/tradition/catholic.png'),
  orthodox: require('../../../assets/brand/tradition/orthodox.png'),
  otherChristian: require('../../../assets/brand/tradition/other-christian.png'),
  protestantEvangelical: require('../../../assets/brand/tradition/protestant-evangelical.png'),
  protestantMainline: require('../../../assets/brand/tradition/protestant-mainline.png'),
  protestantPentecostal: require('../../../assets/brand/tradition/protestant-pentecostal.png'),
  protestantReformed: require('../../../assets/brand/tradition/protestant-reformed.png'),
  stillFiguring: require('../../../assets/brand/tradition/still-figuring.png'),
};

export const practiceBadgeIcons = {
  catholicMass: require('../../../assets/brand/practice/catholic-mass.png'),
  dailyPrayer: require('../../../assets/brand/practice/daily-prayer.png'),
  smallGroup: require('../../../assets/brand/practice/small-group.png'),
  stillFindingACommunity: require('../../../assets/brand/practice/still-finding-a-community.png'),
  sundayInPerson: require('../../../assets/brand/practice/sunday-in-person.png'),
  sundayOnline: require('../../../assets/brand/practice/sunday-online.png'),
  worshipAtHome: require('../../../assets/brand/practice/worship-at-home.png'),
};

export const marketingAssets = {
  emailHeader600x200: require('../../../assets/brand/marketing/email-header-600x200.png'),
  favicon16: require('../../../assets/brand/marketing/favicon-16.png'),
  favicon32: require('../../../assets/brand/marketing/favicon-32.png'),
  favicon180: require('../../../assets/brand/marketing/favicon-180.png'),
  favicon192: require('../../../assets/brand/marketing/favicon-192.png'),
  favicon512: require('../../../assets/brand/marketing/favicon-512.png'),
  landingHero2880x1620: require('../../../assets/brand/marketing/landing-hero-2880x1620.png'),
  ogCard1200x630: require('../../../assets/brand/marketing/og-card-1200x630.png'),
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
  // Conversations tab (v1.2 collapse) reuses the threads asset until a
  // dedicated icon ships. Threads icon best reads as "talking."
  conversations: {
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
  blessPlusCrown: require('../../../assets/brand/glyphs/bless-plus-crown.png'),
  block: require('../../../assets/brand/glyphs/block.png'),
  camera: require('../../../assets/brand/glyphs/camera.png'),
  check: require('../../../assets/brand/glyphs/check.png'),
  checkCircle: require('../../../assets/brand/glyphs/check-circle.png'),
  chevronBack: require('../../../assets/brand/glyphs/chevron-back.png'),
  chevronDown: require('../../../assets/brand/glyphs/chevron-down.png'),
  chevronForward: require('../../../assets/brand/glyphs/chevron-forward.png'),
  chevronUp: require('../../../assets/brand/glyphs/chevron-up.png'),
  close: require('../../../assets/brand/glyphs/close.png'),
  editPencil: require('../../../assets/brand/glyphs/edit-pencil.png'),
  gear: require('../../../assets/brand/glyphs/gear.png'),
  heartOutline: require('../../../assets/brand/glyphs/heart-outline.png'),
  infoCircle: require('../../../assets/brand/glyphs/info-circle.png'),
  languageGlobe: require('../../../assets/brand/glyphs/language-globe.png'),
  loadingSpinner: require('../../../assets/brand/glyphs/loading-spinner.png'),
  lock: require('../../../assets/brand/glyphs/lock.png'),
  minus: require('../../../assets/brand/glyphs/minus.png'),
  plus: require('../../../assets/brand/glyphs/plus.png'),
  reportFlag: require('../../../assets/brand/glyphs/report-flag.png'),
  search: require('../../../assets/brand/glyphs/search.png'),
  shield: require('../../../assets/brand/glyphs/shield.png'),
  signOut: require('../../../assets/brand/glyphs/sign-out.png'),
  verseOfDayHeader: require('../../../assets/brand/glyphs/verse-of-day-header.png'),
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

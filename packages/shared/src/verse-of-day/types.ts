// BLE-102 verse-of-day types.
//
// `mode` (BLE-23 onboarding) governs theme suppression for verse-of-day.
// `friendship-only` users never receive marriage-themed cards (BLE-84 §9).
// `commonsphere` is the parent intent shell; defaults to no suppression.

export type ProfileMode = 'dating' | 'friendship-only' | 'commonsphere';

// Themes used by the editorial calendar. Marriage is the suppressible class.
// Joy / love are the fallback themes per the §9 substitution rule.
export type VerseTheme =
  | 'marriage'
  | 'love'
  | 'joy'
  | 'faith'
  | 'hope'
  | 'peace'
  | 'wisdom'
  | 'service'
  | 'community'
  | 'identity';

// Calendar entry. Verse text is never stored on the entry — see BLE-98 cache.
export type VerseEntry = {
  date: string; // ISO YYYY-MM-DD (UTC)
  weekNumber: number; // ISO week 1..53
  theme: VerseTheme;
  ref: string; // e.g. "Yohanes 3:16"
};

export type SubstitutionReason =
  | 'same-week-non-marriage'
  | 'recent-joy-love-fallback';

export type SelectedVerse = {
  entry: VerseEntry;
  substituted: boolean;
  reason?: SubstitutionReason;
  originalEntry?: VerseEntry;
};

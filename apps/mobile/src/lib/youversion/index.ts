// YouVersion Bible deep-link builder.
//
// Generates URLs that open the YouVersion Bible app (or website fallback)
// so users can read the full chapter/passage around a verse of the day.
//
// Supported translations:
//   TB2  → version id 206 (bible.com)
//   TB   → version id 175 (bible.com)
//   NIV  → version id 111 (bible.com)

import type { Translation } from '../verse/index.js';

export const YV_VERSION_ID: Record<Translation, number> = {
  tb2: 206,
  tb: 175,
  niv: 111,
};

// USFM book codes (3-letter, with leading digit when needed).
const BOOK_MAP: Record<string, string> = {
  // Indonesian (TB / TB2)
  'kejadian': 'GEN',
  'keluaran': 'EXO',
  'imamat': 'LEV',
  'bilangan': 'NUM',
  'ulangan': 'DEU',
  'yosua': 'JOS',
  'hakim': 'JDG',
  'hakim-hakim': 'JDG',
  'rut': 'RUT',
  '1 samuel': '1SA',
  '2 samuel': '2SA',
  '1 raja-raja': '1KI',
  '2 raja-raja': '2KI',
  '1 tawarikh': '1CH',
  '2 tawarikh': '2CH',
  'ezra': 'EZR',
  'nehemia': 'NEH',
  'ester': 'EST',
  'ayub': 'JOB',
  'mazmur': 'PSA',
  'amsal': 'PRO',
  'pengkhotbah': 'ECC',
  'kidung agung': 'SNG',
  'yesaya': 'ISA',
  'yeremia': 'JER',
  'ratapan': 'LAM',
  'yehezkiel': 'EZK',
  'daniel': 'DAN',
  'hosea': 'HOS',
  'yoel': 'JOL',
  'amos': 'AMO',
  'obaja': 'OBA',
  'yunus': 'JON',
  'mikha': 'MIC',
  'nahum': 'NAM',
  'habakuk': 'HAB',
  'zefanya': 'ZEP',
  'hagai': 'HAG',
  'zakharia': 'ZEC',
  'maleakhi': 'MAL',
  'matius': 'MAT',
  'markus': 'MRK',
  'lukas': 'LUK',
  'yohanes': 'JHN',
  'kisah para rasul': 'ACT',
  'kisah': 'ACT',
  'roma': 'ROM',
  '1 korintus': '1CO',
  '2 korintus': '2CO',
  'galatia': 'GAL',
  'efesus': 'EPH',
  'filipi': 'PHP',
  'kolose': 'COL',
  '1 tesalonika': '1TH',
  '2 tesalonika': '2TH',
  '1 timotius': '1TI',
  '2 timotius': '2TI',
  'titus': 'TIT',
  'filemon': 'PHM',
  'ibrani': 'HEB',
  'yakobus': 'JAS',
  '1 petrus': '1PE',
  '2 petrus': '2PE',
  '1 yohanes': '1JN',
  '2 yohanes': '2JN',
  '3 yohanes': '3JN',
  'yudas': 'JUD',
  'wahyu': 'REV',

  // English (NIV) — only entries that differ from Indonesian above.
  'genesis': 'GEN',
  'exodus': 'EXO',
  'leviticus': 'LEV',
  'numbers': 'NUM',
  'deuteronomy': 'DEU',
  'joshua': 'JOS',
  'judges': 'JDG',
  'ruth': 'RUT',
  '1 kings': '1KI',
  '2 kings': '2KI',
  '1 chronicles': '1CH',
  '2 chronicles': '2CH',
  'nehemiah': 'NEH',
  'esther': 'EST',
  'job': 'JOB',
  'psalms': 'PSA',
  'psalm': 'PSA',
  'proverbs': 'PRO',
  'ecclesiastes': 'ECC',
  'song of solomon': 'SNG',
  'song of songs': 'SNG',
  'isaiah': 'ISA',
  'jeremiah': 'JER',
  'lamentations': 'LAM',
  'ezekiel': 'EZK',
  'obadiah': 'OBA',
  'jonah': 'JON',
  'micah': 'MIC',
  'habakkuk': 'HAB',
  'zephaniah': 'ZEP',
  'haggai': 'HAG',
  'zechariah': 'ZEC',
  'malachi': 'MAL',
  'matthew': 'MAT',
  'mark': 'MRK',
  'luke': 'LUK',
  'john': 'JHN',
  'acts': 'ACT',
  'romans': 'ROM',
  '1 corinthians': '1CO',
  '2 corinthians': '2CO',
  'galatians': 'GAL',
  'ephesians': 'EPH',
  'philippians': 'PHP',
  'colossians': 'COL',
  '1 thessalonians': '1TH',
  '2 thessalonians': '2TH',
  '1 timothy': '1TI',
  '2 timothy': '2TI',
  'philemon': 'PHM',
  'hebrews': 'HEB',
  'james': 'JAS',
  '1 peter': '1PE',
  '2 peter': '2PE',
  '1 john': '1JN',
  '2 john': '2JN',
  '3 john': '3JN',
  'jude': 'JUD',
  'revelation': 'REV',
};

/** Normalise a book string so it can be looked up in BOOK_MAP. */
function normalizeBook(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[:\d\s]+$/, '')
    .trim();
}

/**
 * Parse a human-readable reference into (bookCode, chapter, verseStart, verseEnd).
 *
 * Supported shapes:
 *   "John 3:16"
 *   "John 3:16-18"
 *   "1 Korintus 13:4"
 *   "Mazmur 23"
 *   "Kejadian 1:1-3"
 */
export function parseReference(
  ref: string,
): { bookCode: string; chapter: number; verseStart: number | null; verseEnd: number | null } | null {
  const trimmed = ref.trim();

  // Strip trailing translations like (TB2), (NIV), etc.
  const clean = trimmed.replace(/\s*\([^)]*\)\s*$/, '').trim();

  // Match: optional leading digit + book name, then chapter, optional :verse[-end]
  const m = clean.match(/^(\d?\s*[^\d:]+)\s+(\d+)(?::(\d+)(?:\s*-\s*(\d+))?)?\s*$/);
  if (!m) return null;

  const bookPart = normalizeBook(m[1]!);
  const bookCode = BOOK_MAP[bookPart];
  if (!bookCode) return null;

  const chapter = parseInt(m[2]!, 10);
  const verseStart = m[3] != null ? parseInt(m[3], 10) : null;
  const verseEnd = m[4] != null ? parseInt(m[4], 10) : verseStart;

  return { bookCode, chapter, verseStart, verseEnd };
}

/**
 * Build a YouVersion web URL.
 *
 * Falls back to chapter-level link when verse parsing fails so the user
 * still lands near the right place.
 */
export function buildYouVersionUrl(ref: string, translation: Translation): string {
  const versionId = YV_VERSION_ID[translation];
  const parsed = parseReference(ref);

  if (!parsed) {
    // Last resort: search page
    return `https://www.bible.com/search?q=${encodeURIComponent(ref)}`;
  }

  const { bookCode, chapter, verseStart, verseEnd } = parsed;

  let passage = `${bookCode}.${chapter}`;
  if (verseStart != null) {
    passage += `.${verseStart}`;
    if (verseEnd != null && verseEnd !== verseStart) {
      passage += `-${verseEnd}`;
    }
  }

  return `https://www.bible.com/bible/${versionId}/${passage}`;
}

/** Build a YouVersion app deep-link (falls back to web via canOpenURL). */
export function buildYouVersionAppUrl(ref: string): string {
  const parsed = parseReference(ref);
  if (!parsed) {
    return `youversion://search?query=${encodeURIComponent(ref)}`;
  }
  const { bookCode, chapter, verseStart } = parsed;
  let passage = `${bookCode}.${chapter}`;
  if (verseStart != null) passage += `.${verseStart}`;
  return `youversion://bible?reference=${passage}`;
}

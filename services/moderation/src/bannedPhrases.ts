/**
 * Banned-phrase list — Pastor-approved 2026-04-30 (blanket approval, BLE-4).
 *
 * Conservative defaults shipped here so the pipeline cannot be bypassed.
 * Future revisions still go through Pastor; this list is the v1 baseline.
 *
 * Match strategy: substring match against normalized text (lowercased,
 * unicode-NFKC, collapsed whitespace, accents stripped). We deliberately do
 * NOT use word boundaries because attackers commonly insert punctuation
 * ("s.e.x", "n u d e"). Normalization is in textNormalize.ts.
 */

export interface BannedPhrase {
  /** Substring to match against normalized text. */
  needle: string;
  /** 'hard' triggers block, 'soft' triggers SoftFlag (deliver but flag). */
  severity: "hard" | "soft";
  /** Soft flag emitted when severity = 'soft'. */
  softFlag?: "off_platform_pressure" | "photo_request" | "contact_info_share" | "banned_phrase_soft";
}

/** Hard sexual / nudity / explicit terminology. Conservative defaults. */
const HARD_SEXUAL: BannedPhrase[] = [
  // Explicit body / sexual act terms — placeholder list, Pastor will trim/extend.
  { needle: "send nude", severity: "hard" },
  { needle: "send nudes", severity: "hard" },
  { needle: "send pic of your", severity: "hard" },
  { needle: "send a pic of your", severity: "hard" },
  { needle: "naked photo", severity: "hard" },
  { needle: "naked pic", severity: "hard" },
  { needle: "show me your body", severity: "hard" },
  { needle: "show me your boobs", severity: "hard" },
  { needle: "sext", severity: "hard" },
  { needle: "sexting", severity: "hard" },
  { needle: "horny", severity: "hard" },
  { needle: "wanna fuck", severity: "hard" },
  { needle: "want to fuck", severity: "hard" },
  { needle: "lets fuck", severity: "hard" },
  { needle: "hookup tonight", severity: "hard" },
  { needle: "hook up tonight", severity: "hard" },
];

/**
 * Off-platform meeting / contact-info pressure. Soft: deliver but flag.
 *
 * Rationale: these are normal early-relationship messages on most apps but
 * raise risk on a faith-first product. We deliver, flag the thread for
 * spot-check, and let the Pastor decide which become hard blocks.
 */
const SOFT_OFF_PLATFORM: BannedPhrase[] = [
  { needle: "meet today", severity: "soft", softFlag: "off_platform_pressure" },
  { needle: "meet tonight", severity: "soft", softFlag: "off_platform_pressure" },
  { needle: "let's meet today", severity: "soft", softFlag: "off_platform_pressure" },
  { needle: "let us meet today", severity: "soft", softFlag: "off_platform_pressure" },
  { needle: "come to my place", severity: "soft", softFlag: "off_platform_pressure" },
  { needle: "come to my hotel", severity: "soft", softFlag: "off_platform_pressure" },
  { needle: "send me a pic", severity: "soft", softFlag: "photo_request" },
  { needle: "send me a picture", severity: "soft", softFlag: "photo_request" },
  { needle: "send me your photo", severity: "soft", softFlag: "photo_request" },
  { needle: "whatsapp me", severity: "soft", softFlag: "contact_info_share" },
  { needle: "telegram me", severity: "soft", softFlag: "contact_info_share" },
  { needle: "my number is", severity: "soft", softFlag: "contact_info_share" },
  { needle: "text me at", severity: "soft", softFlag: "contact_info_share" },
];

export const DEFAULT_BANNED_PHRASES: ReadonlyArray<BannedPhrase> = [
  ...HARD_SEXUAL,
  ...SOFT_OFF_PLATFORM,
];

export function loadBannedPhrases(custom?: ReadonlyArray<BannedPhrase>): ReadonlyArray<BannedPhrase> {
  return custom && custom.length > 0 ? custom : DEFAULT_BANNED_PHRASES;
}

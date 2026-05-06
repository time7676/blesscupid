// Static opener templates for chat composer suggestions.
//
// Returned by VerseService.suggestionsForThread(threadId, viewerId). NO LLM
// calls — pre-vetted strings only, brand-aligned (serious-intent Christian,
// no flirty/Tinder vibes). Each call returns up to 3 suggestions, drawn
// from three categories: anchor_verse, whimsy_overlap, generic. Localized
// to the viewer's locale.
//
// Holy Code: avoid anxiety patterns ("they viewed you", "typing now"),
// avoid sexual/hookup framing, never assume marital intent timeline of the
// other party. Tone: warm, curious, low-pressure.

import { VERSE_THEMES, type VerseTheme } from './verse-pool.js';

export type Locale = 'en' | 'id';

export type SuggestionBasis = 'anchor_verse' | 'whimsy_overlap' | 'generic';

export interface Suggestion {
  id: string;
  locale: Locale;
  text: string;
  basedOn: SuggestionBasis;
}

export interface WhimsicalAnswers {
  // Open shape — Profile.whimsicalAnswers is JSONB. We treat any string-leaf
  // overlap as a potential conversation hook.
  [key: string]: string | number | boolean | null | undefined;
}

// ─── per-theme anchor-based openers (12 themes × 2 locales × 5+ each) ────
//
// Phrasing rule: each opener must reference the verse theme implicitly,
// invite reflection, and end with an open-ended question. No "let's grab
// coffee" energy. Length ≤140 chars.

type ThemeTemplates = Record<VerseTheme, { en: string[]; id: string[] }>;

const THEME_TEMPLATES: ThemeTemplates = {
  peace: {
    en: [
      "I've been sitting with this verse on peace — what does peace look like in your week right now?",
      'Peace is hard to come by lately. Where do you usually find yours?',
      "This verse hit different today. What's been on your heart this week?",
      "I love how this verse frames peace as guarding the heart. What's been guarding yours?",
      "When you read this, what came up for you? I'd love to hear.",
    ],
    id: [
      'Aku lagi merenungkan ayat tentang damai sejahtera ini — buatmu, damai itu rupanya seperti apa minggu ini?',
      'Damai itu langka belakangan. Biasanya kamu nemuinnya di mana?',
      'Ayat ini terasa pas hari ini. Apa yang lagi ada di hatimu minggu ini?',
      'Ayat ini bilang damai menjaga hati. Apa yang lagi menjaga hatimu?',
      'Pas baca ayat ini, apa yang muncul di pikiranmu? Mau dengar.',
    ],
  },
  joy: {
    en: [
      'This verse on joy made me smile. What brought you joy this week?',
      "I've been thinking about how joy isn't the same as happy. How would you describe yours lately?",
      "What's something small that's been giving you joy lately?",
      'I read this verse this morning and thought of three people. You were one. How are you?',
      "Joy in the Lord — what does that actually feel like for you these days?",
    ],
    id: [
      'Ayat sukacita ini bikin aku senyum. Apa yang bikin kamu sukacita minggu ini?',
      'Lagi mikir, sukacita itu beda dari sekedar bahagia ya. Buatmu sekarang sukacita itu seperti apa?',
      'Hal kecil apa yang lagi bikin kamu sukacita akhir-akhir ini?',
      'Pagi ini baca ayat ini terus kepikiran beberapa orang. Kamu salah satunya. Apa kabar?',
      'Sukacita di dalam Tuhan — buatmu ini rasanya gimana belakangan?',
    ],
  },
  strength: {
    en: [
      'Where are you drawing strength from this season?',
      "I've been leaning on this verse — what verse has been carrying you lately?",
      'Honest question: when you feel weak, where do you go first?',
      'This verse on strength feels timely. How are you, really?',
      "What's something the Lord has been growing in you lately?",
    ],
    id: [
      'Lagi narik kekuatan dari mana akhir-akhir ini?',
      'Aku lagi sandar ke ayat ini — ayat apa yang lagi menopangmu?',
      'Pertanyaan jujur: pas merasa lemah, kamu lari ke mana duluan?',
      'Ayat tentang kekuatan ini terasa tepat. Apa kabar, beneran?',
      'Hal apa yang lagi Tuhan tumbuhin di kamu belakangan?',
    ],
  },
  love: {
    en: [
      "I love how this verse frames love as patience. What's testing your patience lately, in a good way?",
      "What's something you've learned about love recently?",
      'Reading this made me curious — who taught you the most about love?',
      "When this verse says love bears all things, what's a 'thing' you've borne well lately?",
      "I appreciate how grounded this verse is. How's your heart this week?",
    ],
    id: [
      'Aku suka ayat ini bilang kasih itu sabar. Apa yang lagi nguji kesabaranmu, dalam arti baik?',
      'Apa hal baru yang kamu pelajari tentang kasih akhir-akhir ini?',
      'Pas baca ini aku jadi penasaran — siapa yang paling banyak ngajarin kamu tentang kasih?',
      'Ayat ini bilang kasih sabar menanggung. Hal apa yang lagi kamu tanggung dengan baik akhir-akhir ini?',
      'Aku senang ayat ini membumi. Apa kabar hatimu minggu ini?',
    ],
  },
  wisdom: {
    en: [
      "What's a piece of wisdom you've been holding onto this season?",
      "Trust in the Lord with all your heart — what's the heart-trust look like for you right now?",
      'Curious — who do you go to when you need wisdom?',
      "I've been wrestling with a decision and this verse showed up. Have you ever had that?",
      'What does walking by wisdom (and not just instinct) look like for you?',
    ],
    id: [
      'Hikmat apa yang lagi kamu pegang erat di musim ini?',
      'Percaya Tuhan dengan segenap hati — buatmu sekarang ini rupanya seperti apa?',
      'Penasaran — kalau lagi butuh hikmat, kamu lari ke siapa?',
      'Aku lagi gulat dengan satu keputusan, terus ayat ini muncul. Pernah ngalamin gitu juga?',
      'Buatmu, hidup dalam hikmat (bukan cuma insting) itu kayak apa?',
    ],
  },
  comfort: {
    en: [
      "How are you, really? This verse made me think you'd appreciate the question.",
      "I read this and thought: nobody asks 'how are you' and means it. So — how are you?",
      "What's been your refuge lately?",
      "When you're heavy, who do you usually let in?",
      "This verse says he's near to the brokenhearted. Has that been true for you?",
    ],
    id: [
      'Apa kabar, beneran? Ayat ini bikin aku merasa kamu butuh pertanyaan ini.',
      'Aku baca ini terus mikir: jarang ada yang nanya "apa kabar" sungguhan. Jadi — apa kabar?',
      'Apa yang lagi jadi tempat berlindungmu akhir-akhir ini?',
      'Pas lagi berat, kamu biasa biarin siapa masuk?',
      'Ayat ini bilang Tuhan dekat dengan yang patah hati. Buatmu pernah kerasa nyata?',
    ],
  },
  praise: {
    en: [
      "What's something you're praising God for this week?",
      "I love a praise-themed anchor — what's a recent answered prayer for you?",
      "What's a song or verse that gets you into a praise posture lately?",
      "Have you noticed God in something small this week? I'd love to hear.",
      "What's making your heart say thank you lately?",
    ],
    id: [
      'Apa yang lagi bikin kamu bersyukur sama Tuhan minggu ini?',
      'Aku suka ayat tema syukur ini — doa apa yang baru aja dijawab buatmu?',
      'Lagu atau ayat apa yang bikin hati kamu menyembah belakangan?',
      'Kelihatan tangan Tuhan di hal kecil minggu ini? Aku mau dengar.',
      'Apa yang lagi bikin hatimu bilang terima kasih akhir-akhir ini?',
    ],
  },
  purpose: {
    en: [
      'What does purpose look like for you in this season?',
      "I love this verse on plans — what's something you're discerning lately?",
      "What's a question you've been carrying about your calling?",
      "If God's already started a good work in you — what part feels most alive right now?",
      "What's been pulling at your heart lately?",
    ],
    id: [
      'Buatmu, panggilan/tujuan itu rupanya seperti apa di musim ini?',
      'Aku suka ayat ini soal rencana — apa yang lagi kamu doain/discern?',
      'Pertanyaan apa yang lagi kamu bawa-bawa soal panggilanmu?',
      'Kalau Tuhan udah mulai pekerjaan baik di kamu — bagian mana yang paling terasa hidup sekarang?',
      'Apa yang lagi narik hatimu akhir-akhir ini?',
    ],
  },
  forgiveness: {
    en: [
      "Forgiveness is hard. What's helping you forgive (or be forgiven) lately?",
      'This is a tender verse. How is your heart this week?',
      "I've been thinking about how grace shows up in friendships. Where have you seen it?",
      "What's a moment of grace you've received lately?",
      "If this resonated, I'd love to hear what came up.",
    ],
    id: [
      'Pengampunan itu berat. Apa yang lagi bantu kamu mengampuni (atau diampuni) akhir-akhir ini?',
      'Ayat ini lembut. Apa kabar hatimu minggu ini?',
      'Aku lagi mikirin gimana anugerah muncul di pertemanan. Di mana kamu pernah ngerasain?',
      'Momen kasih karunia apa yang baru kamu terima?',
      'Kalau ayat ini resonan, aku mau dengar apa yang muncul di kamu.',
    ],
  },
  gratitude: {
    en: [
      "What's something you're thankful for this week — even small?",
      'Three things you saw the goodness of God in lately?',
      'I love a thanksgiving anchor. What are you holding gratitude for?',
      "What's been worth celebrating in your week?",
      'Honest version of "how are you" — gratitude edition. What comes up?',
    ],
    id: [
      'Apa yang lagi kamu syukurin minggu ini — sekecil apa pun?',
      'Tiga hal di mana kamu lihat kebaikan Tuhan akhir-akhir ini?',
      'Aku suka ayat ucapan syukur. Apa yang lagi kamu syukurin?',
      'Apa yang layak dirayakan dari mingguanmu?',
      'Versi jujur "apa kabar" — versi syukur. Apa yang muncul?',
    ],
  },
  hope: {
    en: [
      "Where are you placing your hope this season?",
      "What's a hope you're holding quietly right now?",
      'I love this hope verse. What does waiting on the Lord feel like for you?',
      "What's the smallest sign of hope you've seen this week?",
      "If hope had a season for you right now — what season would it be?",
    ],
    id: [
      'Lagi naruh harapanmu di mana musim ini?',
      'Harapan apa yang lagi kamu pegang diam-diam sekarang?',
      'Aku suka ayat pengharapan ini. Buatmu menanti-nantikan Tuhan itu rasanya seperti apa?',
      'Tanda kecil pengharapan apa yang kamu lihat minggu ini?',
      'Kalau pengharapan punya musim buat kamu sekarang — musim apa itu?',
    ],
  },
  faith: {
    en: [
      "Walking by faith and not by sight — what's that looked like for you lately?",
      "What's a step of faith you've taken recently?",
      "I love this faith verse. What's God been growing in your faith lately?",
      "When was the last time faith felt costly for you?",
      "What's a verse that's been steadying your faith this season?",
    ],
    id: [
      'Hidup karena percaya, bukan karena melihat — buatmu rasanya seperti apa belakangan?',
      'Langkah iman apa yang baru kamu ambil?',
      'Aku suka ayat iman ini. Bagian iman apa yang lagi Tuhan tumbuhin di kamu?',
      'Kapan terakhir kali iman terasa mahal buatmu?',
      'Ayat apa yang lagi meneguhkan imanmu di musim ini?',
    ],
  },
};

// ─── generic fallbacks (always available) ────────────────────────────────

const GENERIC: Record<Locale, string[]> = {
  en: [
    'Hi — glad we matched. How is your week going?',
    "Hello! What's been good lately?",
    "Hi. How are you, really?",
    "Hey — pleasure to meet you. What's a small thing you're grateful for today?",
    "Hi! What's something you're looking forward to this week?",
  ],
  id: [
    'Halo — senang ketemu. Apa kabar minggu ini?',
    'Halo! Ada hal baik apa belakangan?',
    'Halo. Apa kabar, beneran?',
    'Hai — senang berkenalan. Apa hal kecil yang kamu syukurin hari ini?',
    'Halo! Lagi nantikan apa minggu ini?',
  ],
};

// ─── whimsy overlap templates ────────────────────────────────────────────

function whimsyTemplate(key: string, value: string, locale: Locale): string {
  // Humanize the key. Profile.whimsicalAnswers in v1 uses keys like
  // `spiritAnimal`, `comfortFood`, `dreamCity`, etc. Render as a low-key
  // observation, not a tease.
  const human = key.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
  if (locale === 'id') {
    return `Kita sama-sama pilih "${value}" di bagian ${human}. Cerita dong — kenapa pilih itu?`;
  }
  return `We both picked "${value}" for ${human}. Curious — what made you pick that?`;
}

// ─── builder ─────────────────────────────────────────────────────────────

export interface BuildSuggestionsArgs {
  anchorTheme: VerseTheme;
  viewerAnswers?: WhimsicalAnswers | null;
  candidateAnswers?: WhimsicalAnswers | null;
  locale: Locale;
  // Optional deterministic seed for tests; default uses Math.random.
  rng?: () => number;
}

function pickOne<T>(xs: readonly T[], rng: () => number): T {
  if (xs.length === 0) throw new Error('pickOne: empty list');
  const idx = Math.floor(rng() * xs.length);
  return xs[Math.min(idx, xs.length - 1)] as T;
}

function findWhimsyOverlap(
  a: WhimsicalAnswers | null | undefined,
  b: WhimsicalAnswers | null | undefined,
): { key: string; value: string } | null {
  if (!a || !b) return null;
  for (const [k, v] of Object.entries(a)) {
    if (typeof v !== 'string' || v.trim().length === 0) continue;
    const other = b[k];
    if (typeof other !== 'string') continue;
    if (other.trim().toLowerCase() === v.trim().toLowerCase()) {
      return { key: k, value: v };
    }
  }
  return null;
}

export function buildSuggestions(args: BuildSuggestionsArgs): Suggestion[] {
  const { anchorTheme, viewerAnswers, candidateAnswers, locale } = args;
  const rng = args.rng ?? Math.random;

  const out: Suggestion[] = [];

  // 1) anchor verse opener — always first.
  const themeBank = THEME_TEMPLATES[anchorTheme] ?? THEME_TEMPLATES.faith;
  const anchorText = pickOne(themeBank[locale], rng);
  out.push({
    id: `anchor:${anchorTheme}:${out.length}`,
    locale,
    text: anchorText,
    basedOn: 'anchor_verse',
  });

  // 2) whimsy overlap — if any.
  const overlap = findWhimsyOverlap(viewerAnswers, candidateAnswers);
  if (overlap) {
    out.push({
      id: `whimsy:${overlap.key}:${out.length}`,
      locale,
      text: whimsyTemplate(overlap.key, overlap.value, locale),
      basedOn: 'whimsy_overlap',
    });
  }

  // 3) generic — fill to 3.
  while (out.length < 3) {
    const generic = pickOne(GENERIC[locale], rng);
    out.push({
      id: `generic:${out.length}`,
      locale,
      text: generic,
      basedOn: 'generic',
    });
  }

  return out.slice(0, 3);
}

// Defensive: assert all themes covered at module load.
for (const t of VERSE_THEMES) {
  const bank = THEME_TEMPLATES[t];
  if (!bank || bank.en.length < 5 || bank.id.length < 5) {
    throw new Error(`suggestion-templates: theme "${t}" missing ≥5 EN+ID openers`);
  }
}

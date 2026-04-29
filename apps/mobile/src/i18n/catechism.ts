/**
 * Catechism copy — locked from BLE-29 §1–§8 (revision 2).
 * Scripture refs: TB2 (id) / NIV (en).
 *
 * DO NOT EDIT without Pastor sign-off + a copy-drift bump in BLE-29.
 */

import type { Locale } from './locale-store.js';

export type Mode = 'friendship' | 'community' | 'marriage';
export type Denomination = 'catholic' | 'protestant' | 'pentecostal' | 'orthodox' | 'other';
export type Ministry = 'worship' | 'children' | 'prayer' | 'mission' | 'youth' | 'other';
export type MarriageTimeline = 'within_1y' | '1_3y' | '3y_plus' | 'unsure';

interface BeatStrings {
  beat1: {
    wordmark: string;
    line1Pre: string;
    line1Em: string;
    line1Post: string;
    line2: string;
    line3: string;
    primaryCta: string;
    signInCta: string;
    legal: string;
    termsLabel: string;
    privacyLabel: string;
  };
  beat2: {
    eyebrow: string;
    title: string;
    sub: string;
    modes: Record<Mode, { title: string; desc: string; citation: string }>;
    footer: string;
    cta: string;
  };
  beat3: {
    eyebrow: string;
    title: string;
    intro: string;
    doctrines: { num: string; head: string; line: string }[];
    expandCta: string;
    ackLabel: string;
    ackHelperPre: string;
    ackHelperBold: string;
    primaryCta: string;
    ghostCta: string;
  };
  beat4: {
    eyebrow: string;
    title: string;
    lede: string;
    body: string;
    verseQuote: string;
    verseRef: string;
    closing: string;
    primaryCta: string;
    backCta: string;
  };
  beat5: {
    eyebrow: string;
    title: string;
    sub: string;
    photoLabel: string;
    photoSub: string;
    hintOk1: string;
    hintOk2: string;
    hintAvoid: string;
    ribbon: string;
    cta: string;
  };
  beat6: {
    eyebrow: string;
    title: string;
    sub: string;
    traditionGroup: string;
    denominationLabel: string;
    denominationHint: string;
    denominations: Record<Denomination, string>;
    homeChurchLabel: string;
    homeChurchPlaceholder: string;
    ministryGroup: string;
    ministrySub: string;
    ministries: Record<Ministry, string>;
    cta: string;
  };
  beat7: {
    eyebrow: string;
    title: string;
    sub: string;
    timelines: Record<MarriageTimeline, { label: string; sub: string }>;
    quietNote: string;
    cta: string;
  };
  beat8: {
    eyebrow: string;
    greet: (firstName: string) => string;
    greetSub: string;
    votdEyebrow: string;
    verseQuote: string;
    verseRef: string;
    primaryCta: string;
    profileCta: string;
  };
  shared: {
    backLabel: string;
    progressAria: (current: number, total: number) => string;
    langPillId: string;
    langPillEn: string;
  };
}

const id: BeatStrings = {
  beat1: {
    wordmark: 'BlessCupid',
    line1Pre: '',
    line1Em: 'Diciptakan menurut gambar Allah.',
    line1Post: ' Disambut dengan anugerah.',
    line2: 'Bagi pengikut Kristus yang mencari sahabat, komunitas, atau pasangan di dalam Dia.',
    line3: 'Hati yang jujur disambut — termasuk yang masih bertanya.',
    primaryCta: 'Mulai',
    signInCta: 'Sudah punya akun? Masuk',
    legal: 'Dengan melanjutkan, Anda menyetujui Syarat dan Privasi.',
    termsLabel: 'Syarat',
    privacyLabel: 'Privasi',
  },
  beat2: {
    eyebrow: 'Discernment · 2 dari 8',
    title: 'Apa yang sedang Tuhan tuntun dalam musim ini?',
    sub: 'Pilih satu atau lebih. Anda dapat mengubahnya kapan saja — tidak ada pintu yang salah di sini.',
    modes: {
      friendship: {
        title: 'Persahabatan',
        desc: 'Besi menajamkan besi. Temukan saudara-saudari seiman untuk berjalan bersama.',
        citation: '(Amsal 27:17, TB2)',
      },
      community: {
        title: 'Komunitas',
        desc: 'Berhimpunlah dengan saudara seiman di sekitar Anda — untuk berdoa, belajar, dan melayani bersama.',
        citation: '(Ibrani 10:24–25, TB2)',
      },
      marriage: {
        title: 'Niat pernikahan',
        desc: 'Berkenalan dengan tujuan, menuju perjanjian. Kami akan berjalan perlahan bersama Anda.',
        citation: '',
      },
    },
    footer: 'Anda dapat mengubahnya kapan saja. Tidak ada pintu yang salah di sini.',
    cta: 'Lanjut',
  },
  beat3: {
    eyebrow: 'Pernyataan iman · 3 dari 8',
    title: 'Yang kami jaga di sini.',
    intro: 'BlessCupid dibangun bagi para pengikut Yesus yang merindukan relasi yang berpusat pada Kristus.',
    doctrines: [
      {
        num: 'i.',
        head: 'Setiap orang adalah gambar Allah.',
        line: 'Diciptakan dengan martabat — disambut dengan anugerah.',
      },
      {
        num: 'ii.',
        head: 'Pernikahan adalah perjanjian seumur hidup.',
        line: 'Antara seorang laki-laki dan seorang perempuan, dalam Kristus.',
      },
      {
        num: 'iii.',
        head: 'Kemurnian, kejujuran, kelembutan.',
        line: 'Dalam setiap percakapan dan perjumpaan di sini.',
      },
    ],
    expandCta: 'Baca pernyataan lengkap',
    ackLabel: 'Saya telah membaca dan akan berjalan bersama yang lain dalam kasih dan hormat.',
    ackHelperPre: 'Wajib untuk melanjutkan. Anda dapat membaca ulang kapan saja di ',
    ackHelperBold: 'Pengaturan → Iman & Nilai',
    primaryCta: 'Saya setuju',
    ghostCta: 'Baca lagi pernyataan lengkap',
  },
  beat4: {
    eyebrow: 'Pernyataan iman · lengkap',
    title: 'Pernyataan iman BlessCupid',
    lede: 'BlessCupid dibangun bagi para pengikut Yesus yang merindukan relasi yang berpusat pada Kristus — persahabatan, komunitas, atau pernikahan.',
    body: 'Kami percaya bahwa setiap orang di sini diciptakan menurut gambar Allah dan layak dihormati (Kejadian 1:27, TB2). Kami menjunjung pernikahan sebagai perjanjian seumur hidup antara seorang laki-laki dan seorang perempuan (Markus 10:6–9, TB2). Kami mengejar kemurnian, kejujuran, dan kelembutan dalam setiap percakapan dan perjumpaan (1 Tesalonika 4:3–7; Efesus 4:29, TB2).',
    verseQuote: '"Taruhlah jarimu di sini dan lihatlah tangan-Ku… janganlah engkau tidak percaya lagi, melainkan percayalah."',
    verseRef: '— Yohanes 20:27, TB2',
    closing: 'Anda tidak perlu memiliki semua jawaban — pertanyaan yang jujur disambut di sini. Dengan bergabung, Anda berkomitmen untuk menghormati sesama sebagaimana Kristus telah menghormati Anda.',
    primaryCta: 'Saya setuju',
    backCta: 'Belum siap? Kembali',
  },
  beat5: {
    eyebrow: 'Foto profil · 5 dari 8',
    title: 'Bagikan wajah Anda dengan tenang.',
    sub: 'Foto wajah jelas, sopan, dan bukan foto grup — supaya seseorang dapat mengenali Anda dengan jujur sejak awal.',
    photoLabel: 'Ketuk untuk memilih foto',
    photoSub: 'JPEG / PNG / HEIC · maks. 10 MB',
    hintOk1: 'Wajah Anda terlihat jelas',
    hintOk2: 'Sopan dan apa adanya',
    hintAvoid: 'Bukan foto grup atau wajah disamarkan',
    ribbon: 'Gambaran ini bukan ujian. Ini cara hormat berkenalan.',
    cta: 'Lanjut',
  },
  beat6: {
    eyebrow: 'Profil iman · 6 dari 8',
    title: 'Di mana Anda berakar?',
    sub: 'Tradisi yang berbeda diterima dengan rendah hati. Pilih yang paling Anda kenal — Anda dapat mengubahnya nanti.',
    traditionGroup: 'Tradisi',
    denominationLabel: 'Denominasi',
    denominationHint: 'Katolik · Protestan · Pentakosta · Ortodoks · Lainnya',
    denominations: {
      catholic: 'Katolik',
      protestant: 'Protestan',
      pentecostal: 'Pentakosta',
      orthodox: 'Ortodoks',
      other: 'Lainnya',
    },
    homeChurchLabel: 'Gereja rumah',
    homeChurchPlaceholder: 'Cari gereja Anda',
    ministryGroup: 'Pelayanan (opsional)',
    ministrySub: 'Jika Anda melayani, kami akan dengan tenang menghubungkan Anda dengan teman seiman yang sehati.',
    ministries: {
      worship: 'Worship',
      children: 'Pelayanan Anak',
      prayer: 'Doa',
      mission: 'Misi',
      youth: 'Pemuda',
      other: 'Lainnya',
    },
    cta: 'Lanjut',
  },
  beat7: {
    eyebrow: 'Niat pernikahan · 7 dari 8',
    title: 'Berkenalan dengan tujuan, perlahan.',
    sub: 'Tidak ada jawaban yang salah. Ini hanya bantu cocokkan harapan dengan jujur.',
    timelines: {
      within_1y: {
        label: 'Dalam 1 tahun',
        sub: 'Saya merasa Tuhan sedang menuntun saya ke arah perjanjian.',
      },
      '1_3y': {
        label: '1–3 tahun',
        sub: 'Terbuka, masih bertumbuh dan menimbang.',
      },
      '3y_plus': {
        label: '3 tahun atau lebih',
        sub: 'Tidak terburu-buru. Persiapan diri lebih dulu.',
      },
      unsure: {
        label: 'Belum yakin',
        sub: 'Itu juga jawaban yang jujur, dan diterima di sini.',
      },
    },
    quietNote: '"Berjalanlah dengan rendah hati bersama Allahmu." — Mikha 6:8',
    cta: 'Lanjut',
  },
  beat8: {
    eyebrow: 'Selamat datang',
    greet: (firstName) => `Salam, ${firstName}.`,
    greetSub: 'Kami senang Anda di sini. Mulai dengan ayat hari ini.',
    votdEyebrow: 'Ayat hari ini',
    verseQuote: '"Serahkanlah hidupmu kepada TUHAN dan percayalah kepada-Nya, dan Ia akan bertindak."',
    verseRef: '— Mazmur 37:5, TB2',
    primaryCta: 'Mulai jelajah',
    profileCta: 'Atur profil dulu',
  },
  shared: {
    backLabel: 'Kembali',
    progressAria: (c, t) => `Langkah ${c} dari ${t}`,
    langPillId: 'ID',
    langPillEn: 'EN',
  },
};

const en: BeatStrings = {
  beat1: {
    wordmark: 'BlessCupid',
    line1Pre: '',
    line1Em: "Made in God's image.",
    line1Post: ' Met with grace.',
    line2: 'For Christ-followers seeking friendship, community, or marriage in Him.',
    line3: 'Honest hearts welcome — even the ones still searching.',
    primaryCta: 'Begin',
    signInCta: 'Already have an account? Sign in',
    legal: 'By continuing, you agree to our Terms and Privacy.',
    termsLabel: 'Terms',
    privacyLabel: 'Privacy',
  },
  beat2: {
    eyebrow: 'Discernment · 2 of 8',
    title: 'What is God leading you toward in this season?',
    sub: 'Pick one or more. You can change this anytime — there is no wrong door here.',
    modes: {
      friendship: {
        title: 'Friendship',
        desc: 'Iron sharpens iron. Find brothers and sisters to walk alongside.',
        citation: '(Proverbs 27:17, NIV)',
      },
      community: {
        title: 'Community',
        desc: 'Gather with believers near you — for prayer, study, and shared service.',
        citation: '(Hebrews 10:24–25, NIV)',
      },
      marriage: {
        title: 'Marriage intent',
        desc: "Date with intention, toward covenant. We'll walk slowly with you.",
        citation: '',
      },
    },
    footer: 'You can change this anytime. There is no wrong door here.',
    cta: 'Continue',
  },
  beat3: {
    eyebrow: 'Faith statement · 3 of 8',
    title: 'What we hold to here.',
    intro: 'BlessCupid is built for followers of Jesus seeking a Christ-centered relationship.',
    doctrines: [
      {
        num: 'i.',
        head: "Every person bears God's image.",
        line: 'Made with dignity — met with grace.',
      },
      {
        num: 'ii.',
        head: 'Marriage is a lifelong covenant.',
        line: 'Between one man and one woman, in Christ.',
      },
      {
        num: 'iii.',
        head: 'Purity, honesty, gentleness.',
        line: 'In every conversation and connection here.',
      },
    ],
    expandCta: 'Read full statement',
    ackLabel: "I've read this and will walk with others here in love and honor.",
    ackHelperPre: 'Required to continue. You can revisit this anytime in ',
    ackHelperBold: 'Settings → Faith & Values',
    primaryCta: 'I agree',
    ghostCta: 'Read the full statement again',
  },
  beat4: {
    eyebrow: 'Faith statement · full',
    title: 'The BlessCupid faith statement',
    lede: 'BlessCupid is built for followers of Jesus seeking a Christ-centered relationship — friendship, community, or marriage.',
    body: "We affirm that every person here is made in God's image and worthy of dignity (Genesis 1:27, NIV). We honor marriage as a lifelong covenant between one man and one woman (Mark 10:6–9, NIV). We pursue purity, honesty, and gentleness in how we speak and connect (1 Thessalonians 4:3–7; Ephesians 4:29, NIV).",
    verseQuote: '"Put your finger here; see my hands… Stop doubting and believe."',
    verseRef: '— John 20:27, NIV',
    closing: "You don't need to have everything figured out — honest questions are welcome here. By joining, you agree to honor others as Christ has honored you.",
    primaryCta: 'I agree',
    backCta: 'Not ready? Go back',
  },
  beat5: {
    eyebrow: 'Profile photo · 5 of 8',
    title: 'Share your face, gently.',
    sub: 'A clear, modest photo — not a group shot — so someone can recognize you honestly from the start.',
    photoLabel: 'Tap to choose a photo',
    photoSub: 'JPEG / PNG / HEIC · max 10 MB',
    hintOk1: 'Your face is clearly visible',
    hintOk2: 'Modest and as you are',
    hintAvoid: 'Not a group shot or hidden face',
    ribbon: "This isn't a test. It's a respectful way to meet.",
    cta: 'Continue',
  },
  beat6: {
    eyebrow: 'Faith profile · 6 of 8',
    title: 'Where are you rooted?',
    sub: 'Different traditions held with humility. Pick what fits best — you can change it later.',
    traditionGroup: 'Tradition',
    denominationLabel: 'Denomination',
    denominationHint: 'Catholic · Protestant · Pentecostal · Orthodox · Other',
    denominations: {
      catholic: 'Catholic',
      protestant: 'Protestant',
      pentecostal: 'Pentecostal',
      orthodox: 'Orthodox',
      other: 'Other',
    },
    homeChurchLabel: 'Home church',
    homeChurchPlaceholder: 'Search your church',
    ministryGroup: 'Ministry (optional)',
    ministrySub: "If you serve, we'll quietly connect you to like-hearted folks who serve too.",
    ministries: {
      worship: 'Worship',
      children: 'Children',
      prayer: 'Prayer',
      mission: 'Mission',
      youth: 'Youth',
      other: 'Other',
    },
    cta: 'Continue',
  },
  beat7: {
    eyebrow: 'Marriage intent · 7 of 8',
    title: 'With intention, slowly.',
    sub: 'No wrong answer. This just helps match expectations honestly.',
    timelines: {
      within_1y: {
        label: 'Within 1 year',
        sub: 'I sense God is leading me toward covenant.',
      },
      '1_3y': {
        label: '1–3 years',
        sub: 'Open, still growing and discerning.',
      },
      '3y_plus': {
        label: '3+ years',
        sub: 'Not in a hurry. Preparing myself first.',
      },
      unsure: {
        label: 'Not sure yet',
        sub: "That's an honest answer too, and welcome here.",
      },
    },
    quietNote: '"Walk humbly with your God." — Micah 6:8',
    cta: 'Continue',
  },
  beat8: {
    eyebrow: 'Welcome',
    greet: (firstName) => `Peace, ${firstName}.`,
    greetSub: "Glad you're here. Start with today's verse.",
    votdEyebrow: 'Verse of the day',
    verseQuote: '"Commit your way to the Lord; trust in him and he will do this."',
    verseRef: '— Psalm 37:5, NIV',
    primaryCta: 'Start exploring',
    profileCta: 'Set up profile first',
  },
  shared: {
    backLabel: 'Back',
    progressAria: (c, t) => `Step ${c} of ${t}`,
    langPillId: 'ID',
    langPillEn: 'EN',
  },
};

export const catechismCopy: Record<Locale, BeatStrings> = { id, en };

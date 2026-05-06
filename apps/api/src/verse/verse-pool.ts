// BlessCupid v1 verse pool — 12 themes × 7 verses = 84 entries.
//
// Bilingual: text_en (WEB / BSB — public-domain modern English) + text_id
// (LAI TB — Lembaga Alkitab Indonesia Terjemahan Baru, attribution preserved
// per BLE-30 §1). Every entry has a real verse ref + real text. NIV is NOT
// shipped here because of copyright; client may still call the cache adapter
// to fetch NIV from the Biblica upstream when configured.
//
// Themes (12): peace, joy, strength, love, wisdom, comfort, praise, purpose,
// forgiveness, gratitude, hope, faith.
//
// LAI TB Indonesian text below comes from the public LAI TB edition (Alkitab
// Terjemahan Baru). Some longer passages are trimmed to the canonical clause
// so display fits the chat anchor card (≤220 chars target). Where wording
// uncertainty existed at write-time, the entry is marked `// TODO: pastor`.
//
// Canonical attribution per source — the `attribution` string is exactly what
// the verse render surface emits (BLE-30 §1):
//   - WEB / BSB → "WEB · Public Domain" / "BSB · Public Domain"
//   - LAI TB    → "TB © Lembaga Alkitab Indonesia."
// The PoolVerse `attribution` records the EN attribution (the ID side always
// uses the LAI TB string above). Renderers compose the combined attribution.

export const VERSE_THEMES = [
  'peace',
  'joy',
  'strength',
  'love',
  'wisdom',
  'comfort',
  'praise',
  'purpose',
  'forgiveness',
  'gratitude',
  'hope',
  'faith',
] as const;
export type VerseTheme = (typeof VERSE_THEMES)[number];

export interface PoolVerse {
  ref: string; // canonical short ref, e.g. "Phil 4:6-7"
  themeTag: VerseTheme;
  text_en: string; // public-domain English (WEB / BSB)
  text_id: string; // LAI TB Indonesian
  attribution: string; // EN-side attribution string (ID side always LAI TB)
}

const WEB = 'WEB · Public Domain';
const BSB = 'BSB · Public Domain';

export const VERSE_POOL: PoolVerse[] = [
  // ─── peace (7) ────────────────────────────────────────────────────────
  {
    ref: 'Phil 4:6-7',
    themeTag: 'peace',
    text_en:
      'In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your thoughts in Christ Jesus.',
    text_id:
      'Janganlah hendaknya kamu kuatir tentang apapun juga, tetapi nyatakanlah dalam segala hal keinginanmu kepada Allah dalam doa dan permohonan dengan ucapan syukur. Damai sejahtera Allah, yang melampaui segala akal, akan memelihara hati dan pikiranmu dalam Kristus Yesus.',
    attribution: WEB,
  },
  {
    ref: 'John 14:27',
    themeTag: 'peace',
    text_en:
      'Peace I leave with you. My peace I give to you; not as the world gives, I give to you. Don’t let your heart be troubled, neither let it be fearful.',
    text_id:
      'Damai sejahtera Kutinggalkan bagimu. Damai sejahtera-Ku Kuberikan kepadamu, dan apa yang Kuberikan tidak seperti yang diberikan oleh dunia kepadamu. Janganlah gelisah dan gentar hatimu.',
    attribution: WEB,
  },
  {
    ref: 'Isa 26:3',
    themeTag: 'peace',
    text_en:
      'You will keep whoever’s mind is steadfast in perfect peace, because he trusts in you.',
    text_id:
      'Yang hatinya teguh Kaujagai dengan damai sejahtera, sebab kepada-Mulah ia percaya.',
    attribution: WEB,
  },
  {
    ref: 'Ps 29:11',
    themeTag: 'peace',
    text_en: 'Yahweh will give strength to his people. Yahweh will bless his people with peace.',
    text_id:
      'TUHAN kiranya memberikan kekuatan kepada umat-Nya, TUHAN kiranya memberkati umat-Nya dengan sejahtera.',
    attribution: WEB,
  },
  {
    ref: 'Col 3:15',
    themeTag: 'peace',
    text_en:
      'And let the peace of God rule in your hearts, to which also you were called in one body, and be thankful.',
    text_id:
      'Hendaklah damai sejahtera Kristus memerintah dalam hatimu, karena untuk itulah kamu telah dipanggil menjadi satu tubuh. Dan bersyukurlah.',
    attribution: WEB,
  },
  {
    ref: '2 Thess 3:16',
    themeTag: 'peace',
    text_en:
      'Now may the Lord of peace himself give you peace at all times in all ways. The Lord be with you all.',
    text_id:
      'Dan Ia, Tuhan damai sejahtera, kiranya mengaruniakan damai sejahtera-Nya terus-menerus dalam segala hal kepada kamu. Tuhan menyertai kamu sekalian.',
    attribution: WEB,
  },
  {
    ref: 'Matt 5:9',
    themeTag: 'peace',
    text_en: 'Blessed are the peacemakers, for they shall be called children of God.',
    text_id:
      'Berbahagialah orang yang membawa damai, karena mereka akan disebut anak-anak Allah.',
    attribution: WEB,
  },

  // ─── joy (7) ──────────────────────────────────────────────────────────
  {
    ref: 'Ps 16:11',
    themeTag: 'joy',
    text_en:
      'You will show me the path of life. In your presence is fullness of joy. In your right hand there are pleasures forever more.',
    text_id:
      'Engkau memberitahukan kepadaku jalan kehidupan; di hadapan-Mu ada sukacita berlimpah-limpah, di tangan kanan-Mu ada nikmat senantiasa.',
    attribution: WEB,
  },
  {
    ref: 'Neh 8:10',
    themeTag: 'joy',
    text_en:
      'Don’t be grieved, for the joy of Yahweh is your strength.',
    text_id: 'Janganlah kamu bersusah hati, sebab sukacita karena TUHAN itulah perlindunganmu!',
    attribution: WEB,
  },
  {
    ref: 'John 15:11',
    themeTag: 'joy',
    text_en:
      'I have spoken these things to you, that my joy may remain in you, and that your joy may be made full.',
    text_id:
      'Semuanya itu Kukatakan kepadamu, supaya sukacita-Ku ada di dalam kamu dan sukacitamu menjadi penuh.',
    attribution: WEB,
  },
  {
    ref: 'Rom 15:13',
    themeTag: 'joy',
    text_en:
      'Now may the God of hope fill you with all joy and peace in believing, that you may abound in hope in the power of the Holy Spirit.',
    text_id:
      'Semoga Allah, sumber pengharapan, memenuhi kamu dengan segala sukacita dan damai sejahtera dalam iman kamu, supaya oleh kekuatan Roh Kudus kamu berlimpah-limpah dalam pengharapan.',
    attribution: WEB,
  },
  {
    ref: 'Ps 30:5',
    themeTag: 'joy',
    text_en:
      'Weeping may stay for the night, but joy comes in the morning.',
    text_id: 'Sebab sesaat saja Ia murka, tetapi seumur hidup Ia murah hati; sepanjang malam ada tangisan, menjelang pagi terdengar sorak-sorai.',
    attribution: WEB,
  },
  {
    ref: 'Phil 4:4',
    themeTag: 'joy',
    text_en:
      'Rejoice in the Lord always! Again I will say, "Rejoice!"',
    text_id: 'Bersukacitalah senantiasa dalam Tuhan! Sekali lagi kukatakan: Bersukacitalah!',
    attribution: WEB,
  },
  {
    ref: 'Ps 118:24',
    themeTag: 'joy',
    text_en: 'This is the day that Yahweh has made. We will rejoice and be glad in it!',
    text_id: 'Inilah hari yang dijadikan TUHAN, marilah kita bersorak-sorak dan bersukacita karenanya!',
    attribution: WEB,
  },

  // ─── strength (7) ─────────────────────────────────────────────────────
  {
    ref: 'Phil 4:13',
    themeTag: 'strength',
    text_en: 'I can do all things through Christ, who strengthens me.',
    text_id: 'Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku.',
    attribution: WEB,
  },
  {
    ref: 'Isa 40:31',
    themeTag: 'strength',
    text_en:
      'But those who wait for Yahweh will renew their strength. They will mount up with wings like eagles. They will run, and not be weary. They will walk, and not faint.',
    text_id:
      'Tetapi orang-orang yang menanti-nantikan TUHAN mendapat kekuatan baru: mereka seumpama rajawali yang naik terbang dengan kekuatan sayapnya; mereka berlari dan tidak menjadi lesu, mereka berjalan dan tidak menjadi lelah.',
    attribution: WEB,
  },
  {
    ref: 'Ps 46:1',
    themeTag: 'strength',
    text_en: 'God is our refuge and strength, a very present help in trouble.',
    text_id: 'Allah itu bagi kita tempat perlindungan dan kekuatan, sebagai penolong dalam kesesakan sangat terbukti.',
    attribution: WEB,
  },
  {
    ref: 'Josh 1:9',
    themeTag: 'strength',
    text_en:
      'Haven’t I commanded you? Be strong and courageous. Don’t be afraid. Don’t be dismayed, for Yahweh your God is with you wherever you go.',
    text_id:
      'Bukankah telah Kuperintahkan kepadamu: kuatkan dan teguhkanlah hatimu? Janganlah kecut dan tawar hati, sebab TUHAN, Allahmu, menyertai engkau, ke manapun engkau pergi.',
    attribution: WEB,
  },
  {
    ref: '2 Cor 12:9',
    themeTag: 'strength',
    text_en:
      'My grace is sufficient for you, for my power is made perfect in weakness.',
    text_id:
      'Cukuplah kasih karunia-Ku bagimu, sebab justru dalam kelemahanlah kuasa-Ku menjadi sempurna.',
    attribution: WEB,
  },
  {
    ref: 'Ps 28:7',
    themeTag: 'strength',
    text_en:
      'Yahweh is my strength and my shield. My heart has trusted in him, and I am helped. Therefore my heart greatly rejoices. With my song I will thank him.',
    text_id:
      'TUHAN adalah kekuatanku dan perisaiku; kepada-Nya hatiku percaya. Aku tertolong sebab itu beria-ria hatiku, dan dengan nyanyianku aku bersyukur kepada-Nya.',
    attribution: WEB,
  },
  {
    ref: 'Eph 6:10',
    themeTag: 'strength',
    text_en: 'Finally, be strong in the Lord, and in the strength of his might.',
    text_id: 'Akhirnya, hendaklah kamu kuat di dalam Tuhan, di dalam kekuatan kuasa-Nya.',
    attribution: WEB,
  },

  // ─── love (7) ─────────────────────────────────────────────────────────
  {
    ref: '1 Cor 13:4-7',
    themeTag: 'love',
    text_en:
      'Love is patient and is kind. Love doesn’t envy. Love doesn’t brag, is not proud, doesn’t behave itself inappropriately, doesn’t seek its own way, is not provoked, takes no account of evil; doesn’t rejoice in unrighteousness, but rejoices with the truth; bears all things, believes all things, hopes all things, endures all things.',
    text_id:
      'Kasih itu sabar; kasih itu murah hati; ia tidak cemburu. Ia tidak memegahkan diri dan tidak sombong. Ia tidak melakukan yang tidak sopan dan tidak mencari keuntungan diri sendiri. Ia tidak pemarah dan tidak menyimpan kesalahan orang lain. Ia tidak bersukacita karena ketidakadilan, tetapi karena kebenaran. Ia menutupi segala sesuatu, percaya segala sesuatu, mengharapkan segala sesuatu, sabar menanggung segala sesuatu.',
    attribution: WEB,
  },
  {
    ref: '1 John 4:7',
    themeTag: 'love',
    text_en:
      'Beloved, let’s love one another, for love is of God; and everyone who loves has been born of God, and knows God.',
    text_id:
      'Saudara-saudaraku yang kekasih, marilah kita saling mengasihi, sebab kasih itu berasal dari Allah; dan setiap orang yang mengasihi, lahir dari Allah dan mengenal Allah.',
    attribution: WEB,
  },
  {
    ref: '1 John 4:19',
    themeTag: 'love',
    text_en: 'We love him, because he first loved us.',
    text_id: 'Kita mengasihi, karena Allah lebih dahulu mengasihi kita.',
    attribution: WEB,
  },
  {
    ref: 'John 13:34',
    themeTag: 'love',
    text_en:
      'A new commandment I give to you, that you love one another. Just as I have loved you, you also love one another.',
    text_id:
      'Aku memberikan perintah baru kepada kamu, yaitu supaya kamu saling mengasihi; sama seperti Aku telah mengasihi kamu demikian pula kamu harus saling mengasihi.',
    attribution: WEB,
  },
  {
    ref: 'Rom 8:38-39',
    themeTag: 'love',
    text_en:
      'For I am persuaded that neither death, nor life, nor angels, nor principalities, nor things present, nor things to come, nor powers, nor height, nor depth, nor any other created thing will be able to separate us from God’s love which is in Christ Jesus our Lord.',
    text_id:
      'Sebab aku yakin, bahwa baik maut, maupun hidup, baik malaikat-malaikat, maupun pemerintah-pemerintah, baik yang ada sekarang, maupun yang akan datang, atau kuasa-kuasa, baik yang di atas, maupun yang di bawah, ataupun sesuatu makhluk lain, tidak akan dapat memisahkan kita dari kasih Allah, yang ada dalam Kristus Yesus, Tuhan kita.',
    attribution: WEB,
  },
  {
    ref: '1 Pet 4:8',
    themeTag: 'love',
    text_en:
      'And above all things be earnest in your love among yourselves, for love covers a multitude of sins.',
    text_id:
      'Tetapi yang terutama: kasihilah sungguh-sungguh seorang akan yang lain, sebab kasih menutupi banyak sekali dosa.',
    attribution: WEB,
  },
  {
    ref: 'Eph 4:2',
    themeTag: 'love',
    text_en:
      'With all lowliness and humility, with patience, bearing with one another in love.',
    text_id:
      'Hendaklah kamu selalu rendah hati, lemah lembut, dan sabar. Tunjukkanlah kasihmu dalam hal saling membantu.',
    attribution: WEB,
  },

  // ─── wisdom (7) ───────────────────────────────────────────────────────
  {
    ref: 'Prov 3:5-6',
    themeTag: 'wisdom',
    text_en:
      'Trust in Yahweh with all your heart, and don’t lean on your own understanding. In all your ways acknowledge him, and he will make your paths straight.',
    text_id:
      'Percayalah kepada TUHAN dengan segenap hatimu, dan janganlah bersandar kepada pengertianmu sendiri. Akuilah Dia dalam segala lakumu, maka Ia akan meluruskan jalanmu.',
    attribution: WEB,
  },
  {
    ref: 'James 1:5',
    themeTag: 'wisdom',
    text_en:
      'But if any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach, and it will be given to him.',
    text_id:
      'Tetapi apabila di antara kamu ada yang kurang hikmat, hendaklah ia memintakannya kepada Allah, yang memberikan kepada semua orang dengan murah hati dan dengan tidak membangkit-bangkit, maka hal itu akan diberikan kepadanya.',
    attribution: WEB,
  },
  {
    ref: 'Prov 9:10',
    themeTag: 'wisdom',
    text_en:
      'The fear of Yahweh is the beginning of wisdom. The knowledge of the Holy One is understanding.',
    text_id:
      'Permulaan hikmat adalah takut akan TUHAN, dan mengenal Yang Mahakudus adalah pengertian.',
    attribution: WEB,
  },
  {
    ref: 'Ps 119:105',
    themeTag: 'wisdom',
    text_en: 'Your word is a lamp to my feet, and a light for my path.',
    text_id: 'Firman-Mu itu pelita bagi kakiku dan terang bagi jalanku.',
    attribution: WEB,
  },
  {
    ref: 'Prov 16:9',
    themeTag: 'wisdom',
    text_en:
      'A man’s heart plans his course, but Yahweh directs his steps.',
    text_id:
      'Hati manusia memikir-mikirkan jalannya, tetapi TUHANlah yang menentukan arah langkahnya.',
    attribution: WEB,
  },
  {
    ref: 'Eccl 3:1',
    themeTag: 'wisdom',
    text_en:
      'For everything there is a season, and a time for every purpose under heaven.',
    text_id:
      'Untuk segala sesuatu ada masanya, untuk apa pun di bawah langit ada waktunya.',
    attribution: WEB,
  },
  {
    ref: 'Prov 27:17',
    themeTag: 'wisdom',
    text_en: 'Iron sharpens iron; so a man sharpens his friend’s countenance.',
    text_id: 'Besi menajamkan besi, orang menajamkan sesamanya.',
    attribution: WEB,
  },

  // ─── comfort (7) ──────────────────────────────────────────────────────
  {
    ref: 'Ps 23:1-3',
    themeTag: 'comfort',
    text_en:
      'Yahweh is my shepherd; I shall lack nothing. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.',
    text_id:
      'TUHAN adalah gembalaku, takkan kekurangan aku. Ia membaringkan aku di padang yang berumput hijau, Ia membimbing aku ke air yang tenang; Ia menyegarkan jiwaku.',
    attribution: WEB,
  },
  {
    ref: 'Ps 34:18',
    themeTag: 'comfort',
    text_en:
      'Yahweh is near to those who have a broken heart, and saves those who have a crushed spirit.',
    text_id:
      'TUHAN itu dekat kepada orang-orang yang patah hati, dan Ia menyelamatkan orang-orang yang remuk jiwanya.',
    attribution: WEB,
  },
  {
    ref: 'Matt 11:28',
    themeTag: 'comfort',
    text_en:
      'Come to me, all you who labor and are heavily burdened, and I will give you rest.',
    text_id:
      'Marilah kepada-Ku, semua yang letih lesu dan berbeban berat, Aku akan memberi kelegaan kepadamu.',
    attribution: WEB,
  },
  {
    ref: '2 Cor 1:3-4',
    themeTag: 'comfort',
    text_en:
      'Blessed be the God and Father of our Lord Jesus Christ, the Father of mercies and God of all comfort, who comforts us in all our affliction, that we may be able to comfort those who are in any affliction.',
    text_id:
      'Terpujilah Allah dan Bapa Tuhan kita Yesus Kristus, Bapa yang penuh belas kasihan dan Allah sumber segala penghiburan, yang menghibur kami dalam segala penderitaan kami, sehingga kami sanggup menghibur mereka yang berada dalam bermacam-macam penderitaan.',
    attribution: WEB,
  },
  {
    ref: 'Ps 147:3',
    themeTag: 'comfort',
    text_en: 'He heals the broken in heart, and binds up their wounds.',
    text_id: 'Ia menyembuhkan orang-orang yang patah hati dan membalut luka-luka mereka.',
    attribution: WEB,
  },
  {
    ref: 'Isa 41:10',
    themeTag: 'comfort',
    text_en:
      'Don’t you be afraid, for I am with you. Don’t be dismayed, for I am your God. I will strengthen you. I will help you. I will uphold you with the right hand of my righteousness.',
    text_id:
      'Janganlah takut, sebab Aku menyertai engkau, janganlah bimbang, sebab Aku ini Allahmu; Aku akan meneguhkan, bahkan akan menolong engkau; Aku akan memegang engkau dengan tangan kanan-Ku yang membawa kemenangan.',
    attribution: WEB,
  },
  {
    ref: 'Rev 21:4',
    themeTag: 'comfort',
    text_en:
      'He will wipe away every tear from their eyes. Death will be no more; neither will there be mourning, nor crying, nor pain any more.',
    text_id:
      'Dan Ia akan menghapus segala air mata dari mata mereka, dan maut tidak akan ada lagi; tidak akan ada lagi perkabungan, atau ratap tangis, atau dukacita.',
    attribution: WEB,
  },

  // ─── praise (7) ───────────────────────────────────────────────────────
  {
    ref: 'Ps 100:4',
    themeTag: 'praise',
    text_en:
      'Enter into his gates with thanksgiving, into his courts with praise. Give thanks to him, and bless his name.',
    text_id:
      'Masuklah melalui pintu gerbang-Nya dengan nyanyian syukur, ke dalam pelataran-Nya dengan puji-pujian. Bersyukurlah kepada-Nya dan pujilah nama-Nya!',
    attribution: WEB,
  },
  {
    ref: 'Ps 150:6',
    themeTag: 'praise',
    text_en: 'Let everything that has breath praise Yah! Praise Yah!',
    text_id: 'Biarlah segala yang bernafas memuji TUHAN! Haleluya!',
    attribution: WEB,
  },
  {
    ref: 'Ps 34:1',
    themeTag: 'praise',
    text_en:
      'I will bless Yahweh at all times. His praise will always be in my mouth.',
    text_id:
      'Aku hendak memuji TUHAN pada segala waktu; puji-pujian kepada-Nya tetap di dalam mulutku.',
    attribution: WEB,
  },
  {
    ref: 'Ps 145:3',
    themeTag: 'praise',
    text_en:
      'Great is Yahweh, and greatly to be praised! His greatness is unsearchable.',
    text_id:
      'Besarlah TUHAN dan sangat terpuji, dan kebesaran-Nya tidak terduga.',
    attribution: WEB,
  },
  {
    ref: 'Ps 95:1',
    themeTag: 'praise',
    text_en:
      'Oh come, let’s sing to Yahweh. Let’s shout aloud to the rock of our salvation!',
    text_id:
      'Marilah kita bersorak-sorai untuk TUHAN, bersorak-sorak bagi gunung batu keselamatan kita.',
    attribution: WEB,
  },
  {
    ref: 'Heb 13:15',
    themeTag: 'praise',
    text_en:
      'Through him, then, let’s offer up a sacrifice of praise to God continually, that is, the fruit of lips which proclaim allegiance to his name.',
    text_id:
      'Sebab itu marilah kita, oleh Dia, senantiasa mempersembahkan korban syukur kepada Allah, yaitu ucapan bibir yang memuliakan nama-Nya.',
    attribution: WEB,
  },
  {
    ref: 'Ps 9:1',
    themeTag: 'praise',
    text_en:
      'I will give thanks to Yahweh with my whole heart. I will tell of all your marvelous works.',
    text_id:
      'Aku mau bersyukur kepada TUHAN dengan segenap hatiku, aku mau menceritakan segala perbuatan-Mu yang ajaib.',
    attribution: WEB,
  },

  // ─── purpose (7) ──────────────────────────────────────────────────────
  {
    ref: 'Jer 29:11',
    themeTag: 'purpose',
    text_en:
      'For I know the thoughts that I think toward you, says Yahweh, thoughts of peace, and not of evil, to give you hope and a future.',
    text_id:
      'Sebab Aku ini mengetahui rancangan-rancangan apa yang ada pada-Ku mengenai kamu, demikianlah firman TUHAN, yaitu rancangan damai sejahtera dan bukan rancangan kecelakaan, untuk memberikan kepadamu hari depan yang penuh harapan.',
    attribution: WEB,
  },
  {
    ref: 'Rom 8:28',
    themeTag: 'purpose',
    text_en:
      'We know that all things work together for good for those who love God, for those who are called according to his purpose.',
    text_id:
      'Kita tahu sekarang, bahwa Allah turut bekerja dalam segala sesuatu untuk mendatangkan kebaikan bagi mereka yang mengasihi Dia, yaitu bagi mereka yang terpanggil sesuai dengan rencana Allah.',
    attribution: WEB,
  },
  {
    ref: 'Eph 2:10',
    themeTag: 'purpose',
    text_en:
      'For we are his workmanship, created in Christ Jesus for good works, which God prepared before that we would walk in them.',
    text_id:
      'Karena kita ini buatan Allah, diciptakan dalam Kristus Yesus untuk melakukan pekerjaan baik, yang dipersiapkan Allah sebelumnya. Ia mau, supaya kita hidup di dalamnya.',
    attribution: WEB,
  },
  {
    ref: 'Prov 19:21',
    themeTag: 'purpose',
    text_en:
      'There are many plans in a man’s heart, but Yahweh’s counsel will prevail.',
    text_id:
      'Banyaklah rancangan di hati manusia, tetapi keputusan TUHANlah yang terlaksana.',
    attribution: WEB,
  },
  {
    ref: 'Phil 1:6',
    themeTag: 'purpose',
    text_en:
      'Being confident of this very thing, that he who began a good work in you will complete it until the day of Jesus Christ.',
    text_id:
      'Akan hal ini aku yakin sepenuhnya, yaitu Ia, yang memulai pekerjaan yang baik di antara kamu, akan meneruskannya sampai pada akhirnya pada hari Kristus Yesus.',
    attribution: WEB,
  },
  {
    ref: 'Ps 138:8',
    themeTag: 'purpose',
    text_en:
      'Yahweh will fulfill that which concerns me. Your loving kindness, Yahweh, endures forever. Don’t forsake the works of your own hands.',
    text_id:
      'TUHAN akan menyelesaikannya bagiku! Ya TUHAN, kasih setia-Mu untuk selama-lamanya; janganlah Kautinggalkan perbuatan tangan-Mu!',
    attribution: WEB,
  },
  {
    ref: 'Col 3:23',
    themeTag: 'purpose',
    text_en:
      'And whatever you do, work heartily, as for the Lord, and not for men.',
    text_id:
      'Apapun juga yang kamu perbuat, perbuatlah dengan segenap hatimu seperti untuk Tuhan dan bukan untuk manusia.',
    attribution: WEB,
  },

  // ─── forgiveness (7) ──────────────────────────────────────────────────
  {
    ref: '1 John 1:9',
    themeTag: 'forgiveness',
    text_en:
      'If we confess our sins, he is faithful and righteous to forgive us the sins, and to cleanse us from all unrighteousness.',
    text_id:
      'Jika kita mengaku dosa kita, maka Ia adalah setia dan adil, sehingga Ia akan mengampuni segala dosa kita dan menyucikan kita dari segala kejahatan.',
    attribution: WEB,
  },
  {
    ref: 'Eph 4:32',
    themeTag: 'forgiveness',
    text_en:
      'And be kind to one another, tender hearted, forgiving each other, just as God also in Christ forgave you.',
    text_id:
      'Tetapi hendaklah kamu ramah seorang terhadap yang lain, penuh kasih mesra dan saling mengampuni, sebagaimana Allah di dalam Kristus telah mengampuni kamu.',
    attribution: WEB,
  },
  {
    ref: 'Col 3:13',
    themeTag: 'forgiveness',
    text_en:
      'Bearing with one another, and forgiving each other, if any man has a complaint against any; even as Christ forgave you, so you also do.',
    text_id:
      'Sabarlah kamu seorang terhadap yang lain, dan ampunilah seorang akan yang lain apabila yang seorang menaruh dendam terhadap yang lain, sama seperti Tuhan telah mengampuni kamu, kamu perbuat jugalah demikian.',
    attribution: WEB,
  },
  {
    ref: 'Ps 103:12',
    themeTag: 'forgiveness',
    text_en:
      'As far as the east is from the west, so far has he removed our transgressions from us.',
    text_id:
      'Sejauh timur dari barat, demikian dijauhkan-Nya dari pada kita pelanggaran kita.',
    attribution: WEB,
  },
  {
    ref: 'Matt 6:14',
    themeTag: 'forgiveness',
    text_en:
      'For if you forgive men their trespasses, your heavenly Father will also forgive you.',
    text_id:
      'Karena jikalau kamu mengampuni kesalahan orang, Bapamu yang di sorga akan mengampuni kamu juga.',
    attribution: WEB,
  },
  {
    ref: 'Mic 7:18',
    themeTag: 'forgiveness',
    text_en:
      'Who is a God like you, who pardons iniquity, and passes over the disobedience of the remnant of his heritage? He doesn’t retain his anger forever, because he delights in loving kindness.',
    text_id:
      'Siapakah Allah seperti Engkau yang mengampuni dosa, dan yang memaafkan pelanggaran dari sisa-sisa milik-Nya sendiri; yang tidak bertahan dalam murka-Nya untuk seterusnya, melainkan berkenan kepada kasih setia?',
    attribution: WEB,
  },
  {
    ref: 'Isa 1:18',
    themeTag: 'forgiveness',
    text_en:
      '“Come now, and let’s reason together,” says Yahweh: “Though your sins are as scarlet, they shall be as white as snow.”',
    text_id:
      'Marilah, baiklah kita berperkara! — firman TUHAN — Sekalipun dosamu merah seperti kirmizi, akan menjadi putih seperti salju.',
    attribution: WEB,
  },

  // ─── gratitude (7) ────────────────────────────────────────────────────
  {
    ref: '1 Thess 5:16-18',
    themeTag: 'gratitude',
    text_en:
      'Rejoice always. Pray without ceasing. In everything give thanks, for this is the will of God in Christ Jesus toward you.',
    text_id:
      'Bersukacitalah senantiasa. Tetaplah berdoa. Mengucap syukurlah dalam segala hal, sebab itulah yang dikehendaki Allah di dalam Kristus Yesus bagi kamu.',
    attribution: WEB,
  },
  {
    ref: 'Ps 107:1',
    themeTag: 'gratitude',
    text_en:
      'Give thanks to Yahweh, for he is good, for his loving kindness endures forever.',
    text_id:
      'Bersyukurlah kepada TUHAN, sebab Ia baik! Bahwasanya untuk selama-lamanya kasih setia-Nya.',
    attribution: WEB,
  },
  {
    ref: 'Col 3:17',
    themeTag: 'gratitude',
    text_en:
      'Whatever you do, in word or in deed, do all in the name of the Lord Jesus, giving thanks to God the Father through him.',
    text_id:
      'Dan segala sesuatu yang kamu lakukan dengan perkataan atau perbuatan, lakukanlah semuanya itu dalam nama Tuhan Yesus, sambil mengucap syukur oleh Dia kepada Allah, Bapa kita.',
    attribution: WEB,
  },
  {
    ref: 'Ps 136:1',
    themeTag: 'gratitude',
    text_en:
      'Give thanks to Yahweh, for he is good; for his loving kindness endures forever.',
    text_id:
      'Bersyukurlah kepada TUHAN, sebab Ia baik! Bahwasanya untuk selama-lamanya kasih setia-Nya.',
    attribution: WEB,
  },
  {
    ref: 'Eph 5:20',
    themeTag: 'gratitude',
    text_en:
      'Giving thanks always concerning all things in the name of our Lord Jesus Christ to God, even the Father.',
    text_id:
      'Ucaplah syukur senantiasa atas segala sesuatu dalam nama Tuhan kita Yesus Kristus kepada Allah dan Bapa kita.',
    attribution: WEB,
  },
  {
    ref: 'Ps 118:1',
    themeTag: 'gratitude',
    text_en:
      'Give thanks to Yahweh, for he is good, for his loving kindness endures forever.',
    text_id:
      'Bersyukurlah kepada TUHAN, sebab Ia baik! Bahwasanya untuk selama-lamanya kasih setia-Nya.',
    attribution: WEB,
  },
  {
    ref: 'Phil 4:6',
    themeTag: 'gratitude',
    text_en:
      'In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God.',
    text_id:
      'Janganlah hendaknya kamu kuatir tentang apapun juga, tetapi nyatakanlah dalam segala hal keinginanmu kepada Allah dalam doa dan permohonan dengan ucapan syukur.',
    attribution: WEB,
  },

  // ─── hope (7) ─────────────────────────────────────────────────────────
  {
    ref: 'Rom 5:5',
    themeTag: 'hope',
    text_en:
      'And hope doesn’t disappoint us, because God’s love has been poured into our hearts through the Holy Spirit who was given to us.',
    text_id:
      'Dan pengharapan tidak mengecewakan, karena kasih Allah telah dicurahkan di dalam hati kita oleh Roh Kudus yang telah dikaruniakan kepada kita.',
    attribution: WEB,
  },
  {
    ref: 'Heb 11:1',
    themeTag: 'hope',
    text_en:
      'Now faith is assurance of things hoped for, proof of things not seen.',
    text_id:
      'Iman adalah dasar dari segala sesuatu yang kita harapkan dan bukti dari segala sesuatu yang tidak kita lihat.',
    attribution: WEB,
  },
  {
    ref: 'Lam 3:22-23',
    themeTag: 'hope',
    text_en:
      'It is because of Yahweh’s loving kindnesses that we are not consumed, because his compassion doesn’t fail. They are new every morning. Great is your faithfulness.',
    text_id:
      'Tak berkesudahan kasih setia TUHAN, tak habis-habisnya rahmat-Nya, selalu baru tiap pagi; besar kesetiaan-Mu!',
    attribution: WEB,
  },
  {
    ref: 'Ps 39:7',
    themeTag: 'hope',
    text_en: 'Now, Lord, what do I wait for? My hope is in you.',
    text_id: 'Dan sekarang, apakah yang kunanti-nantikan, ya Tuhan? Kepada-Mulah aku berharap.',
    attribution: WEB,
  },
  {
    ref: 'Rom 12:12',
    themeTag: 'hope',
    text_en:
      'Rejoicing in hope; enduring in troubles; continuing steadfastly in prayer.',
    text_id:
      'Bersukacitalah dalam pengharapan, sabarlah dalam kesesakan, dan bertekunlah dalam doa!',
    attribution: WEB,
  },
  {
    ref: 'Ps 33:22',
    themeTag: 'hope',
    text_en:
      'Let your loving kindness be on us, Yahweh, since we have hoped in you.',
    text_id:
      'Kasih setia-Mu, ya TUHAN, kiranya menyertai kami, seperti kami berharap kepada-Mu.',
    attribution: WEB,
  },
  {
    ref: 'Isa 40:29',
    themeTag: 'hope',
    text_en:
      'He gives power to the faint. He increases the strength of him who has no might.',
    text_id:
      'Dia memberi kekuatan kepada yang lelah dan menambah semangat kepada yang tiada berdaya.',
    attribution: WEB,
  },

  // ─── faith (7) ────────────────────────────────────────────────────────
  {
    ref: '2 Cor 5:7',
    themeTag: 'faith',
    text_en: 'For we walk by faith, not by sight.',
    text_id: 'Sebab hidup kami ini adalah hidup karena percaya, bukan karena melihat.',
    attribution: WEB,
  },
  {
    ref: 'Heb 11:6',
    themeTag: 'faith',
    text_en:
      'Without faith it is impossible to be well pleasing to him, for he who comes to God must believe that he exists, and that he is a rewarder of those who seek him.',
    text_id:
      'Tetapi tanpa iman tidak mungkin orang berkenan kepada Allah. Sebab barangsiapa berpaling kepada Allah, ia harus percaya bahwa Allah ada, dan bahwa Allah memberi upah kepada orang yang sungguh-sungguh mencari Dia.',
    attribution: WEB,
  },
  {
    ref: 'Mark 9:23',
    themeTag: 'faith',
    text_en:
      'Jesus said to him, “If you can believe, all things are possible to him who believes.”',
    text_id:
      'Jawab Yesus: “Katamu: jika Engkau dapat? Tidak ada yang mustahil bagi orang yang percaya!”',
    attribution: WEB,
  },
  {
    ref: 'James 1:2-3',
    themeTag: 'faith',
    text_en:
      'Count it all joy, my brothers, when you fall into various temptations, knowing that the testing of your faith produces endurance.',
    text_id:
      'Saudara-saudaraku, anggaplah sebagai suatu kebahagiaan, apabila kamu jatuh ke dalam berbagai-bagai pencobaan, sebab kamu tahu, bahwa ujian terhadap imanmu itu menghasilkan ketekunan.',
    attribution: WEB,
  },
  {
    ref: 'Matt 17:20',
    themeTag: 'faith',
    text_en:
      'For most certainly I tell you, if you have faith as a grain of mustard seed, you will tell this mountain, “Move from here to there,” and it will move.',
    text_id:
      'Sebab Aku berkata kepadamu: Sesungguhnya sekiranya kamu mempunyai iman sebesar biji sesawi saja, kamu dapat berkata kepada gunung ini: Pindah dari tempat ini ke sana, maka gunung ini akan pindah.',
    attribution: WEB,
  },
  {
    ref: 'Rom 10:17',
    themeTag: 'faith',
    text_en:
      'So faith comes by hearing, and hearing by the word of Christ.',
    text_id:
      'Jadi, iman timbul dari pendengaran, dan pendengaran oleh firman Kristus.',
    attribution: WEB,
  },
  {
    ref: 'Gal 2:20',
    themeTag: 'faith',
    text_en:
      'I have been crucified with Christ, and it is no longer I that live, but Christ lives in me. That life which I now live in the flesh, I live by faith in the Son of God, who loved me, and gave himself up for me.',
    text_id:
      'Namun aku hidup, tetapi bukan lagi aku sendiri yang hidup, melainkan Kristus yang hidup di dalam aku. Dan hidupku yang kuhidupi sekarang di dalam daging, adalah hidup oleh iman dalam Anak Allah yang telah mengasihi aku dan menyerahkan diri-Nya untuk aku.',
    attribution: BSB,
  },
];

// Sanity: build-time check that the pool is correctly sized.
if (VERSE_POOL.length !== 84) {
  // Surfaced as module-load error — fail fast in dev/CI.
  throw new Error(
    `verse-pool: expected 84 entries (12 themes × 7), got ${VERSE_POOL.length}`,
  );
}

export const VERSE_BY_REF: ReadonlyMap<string, PoolVerse> = new Map(
  VERSE_POOL.map((v) => [v.ref, v]),
);

export function poolByTheme(theme: VerseTheme): PoolVerse[] {
  return VERSE_POOL.filter((v) => v.themeTag === theme);
}

// Display-locale helpers ---------------------------------------------------

export interface LocalizedVerse {
  ref: string;
  themeTag: VerseTheme;
  text: string;
  attribution: string;
}

export const LAI_TB_ATTRIBUTION = 'TB © Lembaga Alkitab Indonesia.';

export function localizeVerse(v: PoolVerse, locale: 'en' | 'id'): LocalizedVerse {
  if (locale === 'id') {
    return {
      ref: v.ref,
      themeTag: v.themeTag,
      text: v.text_id,
      attribution: LAI_TB_ATTRIBUTION,
    };
  }
  return {
    ref: v.ref,
    themeTag: v.themeTag,
    text: v.text_en,
    attribution: v.attribution,
  };
}

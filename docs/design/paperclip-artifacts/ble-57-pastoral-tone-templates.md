# BLE-57 — Pastoral Tone Templates (bilingual)

**Source doctrine:** [BLE-31 — Report-Triage Doctrine Guide](./ble-31-report-triage-doctrine.md)
**Three-voice pattern:** see [`ble-26-chat-moderation/index.html`](./ble-26-chat-moderation/) — proposed §10 of BLE-31, pending Pastor sign-off.
**Report flow surfaces:** see [`ble-27-safety/index.html`](./ble-27-safety/) — six-category taxonomy (BLE-31 §1–§6) already wired.
**Status:** v1.1 — Pastor ratified 2026-04-28 (see Pastor checklist below). Aligned to BLE-31 doctrine v1.2 amendments §3:

- **Ban-tier opener** `diblokir secara permanen` → `kami hentikan secara permanen` across §1, §3, §5, §6 ban templates (verb `blokir` drifts toward §10 forbidden vocabulary; canonical replacements per doctrine v1.2 §3 are `hentikan` / `akhiri`).
- **Appeal email** `appeals@blesscupid.app` → `care@blesscupid.app` across all surfaces (per doctrine v1.2 §2 — *appeals* carries tribunal register; *care* carries pastoral register).
**Owner of this file:** FoundingDesigner, on behalf of Pastor.

---

## Why this file exists

BLE-57 asks us to apply the §10 "pastoral tone reference" from the doctrine doc to the chat moderation banners (BLE-26) and report flow (BLE-27). The doctrine doc as shipped (v1, 2026-04-28) ends at §6 + Operational Notes + Handoff — there is **no §10 yet**.

We have:

1. **Derived a three-voice spec** from the §1–§6 templates and the doctrinal posture preamble. Mock-up: `ble-26-chat-moderation/index.html`. This is the proposed §10.
2. **Translated the §1–§6 copy verbatim into Bahasa Indonesia (TB / casual register)**, with English fallback strings preserved. Bahasa is the product default per BLE-46 i18n.
3. **Stayed inside the doctrine's tone constraints** — no scripture in headlines of removal/ban notices, `care@blesscupid.app` always visible, never red, and no surfacing of convert-from-Islam status anywhere in user-facing copy.

Pastor: please review and either ratify or rewrite. Where you rewrite, BLE-26 banner copy and BLE-27 confirm sheets will pull from this file as canonical.

---

## §10 (proposed) — Three-Voice Pattern

### Voice 1 — Compose-time

> *Friend leaning over your shoulder. "Hey — eyes on what you just typed. You sure?"*

- **When:** preflight classifier flags risk on a draft message before send.
- **Visual register:** yellow-warm. Gold-100 → amber-100 gradient. Gold-500 left rule.
- **Behavior:** never blocks. "Edit dulu" + "Tetap kirim" both clickable. Friction, not gate.
- **Voice:** gentle, present-tense, second-person ("kamu", "you"). Not corporate ("violation detected"). Not church-bulletin ("Beloved...").
- **Scripture:** none. The verse weight goes to ban-tier (Voice 03), not compose-tier.

### Voice 2 — Post-action

> *Calm explainer. "Here's what happened. Here's the door back."*

- **When:** a message was hidden, account paused, match removed by safety, or report actioned.
- **Visual register:** cobalt-soft. Cobalt-50 fill, cobalt-100 border, cobalt-900 headline.
- **Behavior:** dismissable but persists until appeal window closes. Always names the action, the reason, the appeal path.
- **Voice:** explainer, third-person about the action ("Kami sembunyikan satu pesan"). Calm, not apologetic.
- **Scripture:** not in headline. Optional supporting note for §6 doctrinal cases. Save the verse weight for ban (Voice 03).
- **Always render:** `care@blesscupid.app` link + appeal window (default 14 days).

### Voice 3 — Ban / serious notice

> *Warm, never red. Pintu pemulihan tetap terbuka. "This is real. So is the door back."*

- **When:** account removed or banned (any §1–§6 ban-tier).
- **Visual register:** cream canvas. Gold-accent crest (dove, never warning triangle). Cobalt CTA. Verse blockquote rule in gold-500.
- **Structure (canonical):**
  1. Name what was seen — specific, not vague.
  2. Name the harm — to the other person, to the community, to the actor.
  3. Name the action — removal / ban / why this tier.
  4. Door — appeal path or restoration path. Always rendered, even when symbolic.
- **Voice:** grave, not angry. Names the person if known. Says "we don't know your story" when compassion is structurally appropriate.
- **Scripture:** optional, supporting only — never the headline. Set in gold-rule blockquote with translation cite. Omit entirely when actor is atheist/agnostic/seeker per profile.
- **Forbidden:** red color, warning-triangle icons, KJV-cosplay, "Beloved...", sarcasm, surfacing convert-from-Islam status, scripture as removal headline.

---

## Bilingual templates — §1 Harassment

### Warning (single hostile message, ambiguous)

**ID (default)**

> Kami melihat pesan yang kamu kirim ke {nama} pada {tanggal}. Kata-kata itu terasa sebagai pelecehan, walau mungkin bukan itu maksudmu. Tolong tarik napas dulu sebelum kirim pesan dalam keadaan panas — orang di seberang adalah saudara/i yang juga diciptakan dalam gambar Allah (Kej 1:27). Satu insiden lagi seperti ini akan berujung pada penghapusan akun. Balas kalau menurutmu kami salah.

**EN (fallback)**

> We saw the message you sent to {name} on {date}. The words landed as harassment, even if that wasn't your aim. Please pause before sending heat — the person on the other side is a brother/sister made in God's image (Gen 1:27). One more incident like this will lead to removal. Reply if you believe we got this wrong.

### Removal (clear pattern)

**ID**

> Akunmu kami hapus karena pelecehan terhadap {nama} dalam {N} pesan antara {tanggal_awal}–{tanggal_akhir}. Kami sudah meminta kamu untuk berhenti. Kamu terus melanjutkan. BlessCupid ada untuk membantu orang menemukan cinta dengan aman; itu menuntut kita menghormati kata "tidak". Banding dapat diajukan dalam 14 hari ke care@blesscupid.app.
>
> *"Siapa memelihara mulut dan lidahnya, memelihara diri dari pada kesukaran."* — Amsal 21:23 (TB)

**EN**

> Your account is being removed for harassment of {name} across {N} messages between {start_date}–{end_date}. We asked you to stop. You kept going. BlessCupid exists to help people find love in safety; that requires we honor "no." You may appeal within 14 days at care@blesscupid.app.
>
> *"Whoever guards his mouth and tongue keeps himself out of trouble."* — Proverbs 21:23 (ESV)

### Ban (slur / threat / doxx)

**ID**

> Akunmu kami hentikan secara permanen karena {slur / ancaman / membagikan informasi pribadi anggota lain}. Ini bukan siapa kita. Ini bukan siapa yang Kristus panggil kita untuk menjadi. Kata-kata seperti ini melukai orang sungguhan; kami tidak akan membiarkannya tinggal di sini.
>
> *"Dengan lidah kita memuji Tuhan, Bapa kita; dan dengan lidah kita mengutuk manusia yang diciptakan menurut rupa Allah. Dari mulut yang satu keluar berkat dan kutuk. Hal ini, saudara-saudaraku, tidak boleh demikian terjadi."* — Yakobus 3:9-10 (TB)
>
> Kalau kamu yakin ini kesalahan identitas (akun diretas), balas dalam 14 hari ke care@blesscupid.app.

**EN**

> Your account is permanently banned for {slur / threat / sharing private information about another member}. This is not who we are. This is not who Christ calls us to be. Words like these wound real people; we will not host them.
>
> *"With the tongue we praise our Lord and Father, and with it we curse human beings, who have been made in God's likeness. Out of the same mouth come praise and cursing. My brothers and sisters, this should not be."* — James 3:9-10 (NIV)
>
> If you believe this was an error of identity (account compromised), reply within 14 days at care@blesscupid.app.

---

## Bilingual templates — §2 Sexual content / solicitation

### Warning (sexual language pushed past discomfort)

**ID**

> {nama} sudah memberi tahu kamu bahwa dia tidak nyaman dengan arah pembicaraan. Kamu tetap mengirim pesan bersifat seksual. BlessCupid ada untuk hubungan yang menuju pernikahan, dan di luar itu pun — menekan melewati "tidak" bukanlah cinta (1 Kor 13:4-5). Tolong jangan ulangi ini. Insiden berikutnya berujung penghapusan akun.

**EN**

> {name} told you they weren't comfortable with where the conversation was going. You sent a sexual message anyway. BlessCupid is for marriage-minded relationships, and even outside that — pressing past a "no" is never love (1 Cor 13:4-5). Please don't do this again. Next instance is removal.

### Removal (unsolicited explicit imagery)

**ID**

> Kamu mengirim gambar eksplisit ke {nama} tanpa persetujuannya. Gambar tersebut sudah dihapus dan akunmu kami hapus dari BlessCupid. Yang kamu kirim bukan flirting; itu pelanggaran. Kami memperlakukan tubuh anggota kami — dan tubuhmu — sebagai sesuatu yang lebih layak dihormati daripada itu.
>
> *"Jauhkanlah dirimu dari percabulan… Kamu bukan milik kamu sendiri, sebab kamu telah dibeli dan harganya telah lunas dibayar. Karena itu muliakanlah Allah dengan tubuhmu."* — 1 Korintus 6:18-20 (TB)
>
> Banding: care@blesscupid.app dalam 14 hari.

**EN**

> You sent explicit imagery to {name} without their consent. The image has been removed and your account is being removed from BlessCupid. What you sent is not flirting; it is a violation. We treat the bodies of our members — and your body — as worthy of more honor than that.
>
> *"Flee from sexual immorality… You are not your own; you were bought at a price. Therefore honor God with your bodies."* — 1 Corinthians 6:18-20 (NIV)
>
> Appeals: care@blesscupid.app within 14 days.

### Ban — CSAM (do not draft pastorally)

**ID** *(banner only — no scripture, no pastoral framing per BLE-31 §2)*

> Akun dihentikan secara permanen. Dilaporkan ke pihak berwenang.

**EN**

> Account permanently terminated. Reported to law enforcement.

---

## Bilingual templates — §3 Fake profiles

### Warning (photo mismatch, benefit of doubt)

**ID**

> Seorang anggota melaporkan bahwa foto-fotomu mungkin bukan dirimu. Kami tidak menuduh — kadang profil memakai foto lama atau foto pinjaman. Dalam 7 hari, tolong verifikasi dengan selfie langsung ({link}). Sampai itu, profilmu kami jeda. Kami melakukan ini karena cinta dimulai dari kebenaran (Ef 4:25).

**EN**

> A member flagged that your photos may not be of you. We're not accusing — sometimes profiles use older photos or borrowed ones. Within 7 days, please verify with a live selfie ({link}). Until then, your profile is paused. We do this because love starts with truth (Eph 4:25).

### Removal (verified catfish, no financial element)

**ID**

> Kami sudah memastikan foto-foto di profilmu milik orang lain. Akunmu kami hapus. Kami tidak tahu seluruh ceritamu, dan kami tidak di sini untuk mempermalukanmu — tapi BlessCupid hanya bisa berjalan kalau setiap orang yang muncul adalah dirinya sendiri. Kalau ceritamu adalah "aku kesepian dan merasa kurang", kami dengar, dan kami percaya kamu cukup. Datang lagi sebagai dirimu. Pintu terbuka: care@blesscupid.app.
>
> *"Karena itu buanglah dusta dan berkatalah benar seorang kepada yang lain, karena kita adalah sesama anggota."* — Efesus 4:25 (TB)

**EN**

> We confirmed the photos on your profile belong to someone else. Your account is being removed. We don't know your story, and we're not here to humiliate you — but BlessCupid only works if the person on each side is real. If your story is "I was lonely and didn't think I was enough," we hear you, and we believe you are. Come back as you. The door is open: care@blesscupid.app.
>
> *"Therefore each of you must put off falsehood and speak truthfully to your neighbor, for we are all members of one body."* — Ephesians 4:25 (NIV)

### Ban (catfish + scam pattern)

**ID**

> Akunmu kami hentikan secara permanen karena penyamaran identitas yang terhubung dengan pola penipuan yang sudah dikenal. Foto milik {redacted} dipakai untuk menipu beberapa anggota. Ini bukan kesepian; ini pencurian kepercayaan.
>
> *"Bibir dusta adalah kekejian bagi TUHAN, tetapi orang yang berlaku setia dikenan-Nya."* — Amsal 12:22 (TB)

**EN**

> Your account is permanently banned for impersonation tied to a known fraud pattern. Photos belonging to {redacted} were used to deceive multiple members. This was not loneliness; this was theft of trust.
>
> *"The Lord detests lying lips, but he delights in people who are trustworthy."* — Proverbs 12:22 (NIV)

---

## Bilingual templates — §4 Off-platform pressure

### Warning (asking too early)

**ID**

> Kamu meminta {nama} untuk pindah ke {WhatsApp / LINE / dll} di pesan {pertama / kedua}. Kami mengerti — aplikasi terasa kaku. Tapi pindah platform terlalu cepat menghilangkan alat keamanan yang melindungi kalian berdua. Biarkan kepercayaan tumbuh di sini dulu. Kalau {nama} nyaman, dia yang akan mengajak.

**EN**

> You asked {name} to move to {WhatsApp / LINE / etc.} in your {first / second} message. We get it — apps are clunky. But moving off-platform too early removes the safety tools that protect both of you. Let trust build here first. If {name} is comfortable, they'll lead.

### Removal (repeated push after stop)

**ID**

> {nama} sudah memberitahumu bahwa dia ingin tetap berbicara di BlessCupid. Kamu terus mendesak. Mendesak seseorang untuk meninggalkan platform setelah dia menolak adalah bendera merah yang kami anggap serius — biasanya untuk orang yang didesak, kadang untuk orang yang mendesak. Akun kami hapus. Banding: care@blesscupid.app.
>
> *"Ia tidak melakukan yang tidak sopan dan tidak mencari keuntungannya sendiri."* — 1 Korintus 13:5 (TB)

**EN**

> {name} told you they wanted to keep talking on BlessCupid. You kept asking. Pressuring someone to leave the platform after they've said no is a red flag we take seriously — usually for the person being pressured, sometimes for the person doing the pressuring. Account removed. Appeal: care@blesscupid.app.
>
> *"Love does not insist on its own way."* — 1 Corinthians 13:5 (ESV)

---

## Bilingual templates — §5 Financial / scam

### Removal (direct ask)

**ID**

> Akunmu kami hapus karena meminta {uang / gift card / kripto / dana investasi} kepada {nama}. BlessCupid bukan platform penggalangan dana. Kalau situasimu nyata, gerejamu, keluargamu, atau bantuan lokal akan menolong — pasanganmu di sini bukan orang yang tepat untuk diminta. Kalau situasimu tidak nyata, mohon pahami: orang mengirim uang karena percaya kamu peduli. Itu bukan luka kecil.
>
> *"Janganlah kamu menjadi hamba uang dan cukupkanlah dirimu dengan apa yang ada padamu."* — Ibrani 13:5 (TB)

**EN**

> Your account is being removed for asking {name} for {money / a gift card / crypto / investment funds}. BlessCupid is not a fundraising platform. If your situation is real, your church, your family, or local aid will help — your match is not the right asker. If your situation is not real, please understand: people send money because they believed you cared. That is not a small wound.
>
> *"Keep your lives free from the love of money and be content with what you have."* — Hebrews 13:5 (NIV)

### Ban (pig butchering / scam ring / MLM after warning)

**ID**

> Akunmu kami hentikan secara permanen karena {penipuan investasi terkoordinasi / rekrutmen MLM berulang / pola penipuan yang cocok dengan jaringan yang dikenal}. Kami sudah menandai akun-akun terkait ke platform lain melalui {referensi konsorsium keamanan, bila berlaku}. Siapa pun yang kamu tipu sebaiknya menghubungi otoritas setempat; kami bekerja sama dengan penyidik bila diperlukan.
>
> *"Harta yang cepat diperoleh akan berkurang, tetapi siapa mengumpulkan sedikit demi sedikit, menjadi kaya."* — Amsal 13:11 (TB)

**EN**

> Your account is permanently banned for {coordinated investment fraud / continued MLM recruitment / scam pattern matched to known ring}. We have flagged the relevant accounts to other platforms via {shared safety consortium reference, when applicable}. Anyone you defrauded should reach out to local authorities; we are cooperating with investigators where requested.
>
> *"Dishonest money dwindles away, but whoever gathers money little by little makes it grow."* — Proverbs 13:11 (NIV)

### Pastoral note (charging for prayer)

**ID**

> Seorang anggota melaporkan bahwa kamu menawarkan untuk mendoakannya dengan imbalan pembayaran. Kami tidak yakin kamu bermaksud jahat, tapi menjual jasa rohani membawamu ke tempat yang goyah (Kis 8:18-23 — Simon penyihir). Tolong hapus tawaran itu dari profil dan DM-mu. Doa itu cuma-cuma; kamu dikasihi tanpa biaya.

**EN**

> A member flagged that you offered to pray for them in exchange for payment. We don't believe you meant harm, but selling spiritual services puts you on shaky ground (Acts 8:18-23 — Simon the Magician). Please remove the offer from your profile and DMs. Prayer is free; you are loved without charge.

---

## Bilingual templates — §6 Doctrinal disputes

### Warning (sectarian attack)

**ID**

> Kamu memberitahu {nama} bahwa dia "bukan Kristen sungguhan" karena {isu spesifik}. BlessCupid menampung orang percaya dari berbagai tradisi yang sama-sama mengaku Yesus adalah Tuhan (Rm 10:9). Perbedaan diizinkan — mendiskualifikasi saudara/i atas isu tersier tidak. Tolong jangan ulangi. Kecocokan ada di filter; koreksi ada di tangan penatua.

**EN**

> You told {name} they "aren't a real Christian" because {specific issue}. BlessCupid hosts believers across traditions who all confess Jesus is Lord (Rom 10:9). Disagreement is allowed — disqualifying a brother or sister over a tertiary issue is not. Please don't repeat this. Compatibility is for filters; correction is for elders.

### Removal (heresy taught aggressively, not seeking)

**ID**

> Akunmu kami hapus karena berulang kali mengajarkan {ajaran sesat spesifik — misalnya penyangkalan keilahian penuh Kristus} kepada anggota lain setelah peringatan kami. Kami bukan magisterium Gereja — kami menampung berbagai tradisi — tapi kredo historis adalah lantai kami. Kami berharap kamu duduk dengan seorang gembala di gereja lokalmu dan bergumul dengan pertanyaan-pertanyaan ini di sana, bukan di DM dengan orang asing yang sedang mencari cinta.
>
> *"Awasilah dirimu sendiri dan awasilah ajaranmu. Bertekunlah dalam semuanya itu, karena dengan berbuat demikian engkau akan menyelamatkan dirimu dan semua orang yang mendengar engkau."* — 1 Timotius 4:16 (TB)

**EN**

> Your account is being removed for repeatedly teaching {specific heresy — e.g., denial of Christ's full deity} to other members after our warning. We are not the church's magisterium — we host across traditions — but the historic creeds are our floor. We hope you sit with a pastor in your local body and wrestle with these questions there, not in DMs with strangers seeking love.
>
> *"Watch your life and doctrine closely. Persevere in them, because if you do, you will save both yourself and your hearers."* — 1 Timothy 4:16 (NIV)

### Ban (predatory cult recruitment)

**ID**

> Akunmu kami hentikan secara permanen karena aktivitas perekrutan kultus yang terkait dengan {nama kelompok, bila terkonfirmasi}. Anggota mempercayakan hatinya kepadamu; kamu memakai kepercayaan itu untuk menarik mereka ke dalam sistem yang sudah terdokumentasi membawa luka. Kami memberi tahu pasangan-pasangan yang kamu hubungi.
>
> *"Waspadalah terhadap nabi-nabi palsu yang datang kepadamu dengan menyamar seperti domba, tetapi sesungguhnya mereka adalah serigala yang buas."* — Matius 7:15 (TB)

**EN**

> Your account is permanently banned for cult-recruitment activity tied to {group name, where confirmed}. Members trusted you with their hearts; you used that trust to pull them toward a system that has documented harm. We are notifying matches you contacted.
>
> *"Watch out for false prophets. They come to you in sheep's clothing, but inwardly they are ferocious wolves."* — Matthew 7:15 (NIV)

### Non-action notice (tertiary doctrine)

**ID**

> Terima kasih sudah melapor. Kami sudah membaca percakapannya. Perbedaan pendapatmu dengan {nama} tentang {baptisan / akhir zaman / perempuan dalam pelayanan / dll} adalah hal yang orang Kristen sudah pegang dengan pandangan berbeda selama berabad-abad. Kami tidak memoderasi doktrin tersier — tapi kamu dapat menyesuaikan filter pasanganmu untuk memprioritaskan {filter terkait}, yang akan mengurangi kecocokan seperti ini.

**EN**

> Thanks for the report. We looked at the conversation. The disagreement you had with {name} about {baptism / end times / women in ministry / etc.} is one Christians have held different views on for centuries. We don't moderate tertiary doctrine — but you can adjust your match filters to prefer {the relevant filter}, which will reduce these matches.

---

## Constraints (canonical, non-negotiable)

1. **Convert-from-Islam users — never expose status in any user-facing moderation copy.** When `account.flags.faith_origin_protected = true`, copy generator strips any phrasing that would surface origin (e.g., the "for someone who came to faith from another tradition" framing). Pastor's BLE-31 §6 doctrine governs the moderation logic; the *copy layer* never reveals the flag.
2. **No red on moderation surfaces.** Red is reserved for genuine panic-exit (BLE-27 hide-app + emergency-exit). Amber-warm for compose-time, cobalt-soft for post-action, cream + gold for ban screens. Red on any moderation banner is a bug.
3. **Scripture rules.** Optional, never a headline of removal/ban. Set in gold-rule blockquote when present. Omit entirely when actor profile flags atheist / agnostic / seeker. CSAM / scam-ring bans omit scripture per §2 / §5 doctrine.
4. **`care@blesscupid.app` always visible.** Every warning, removal, and ban (except CSAM where Legal advises otherwise) renders the appeal email and the appeal window (default 14 days).
5. **Bilingual rendering.** Bahasa is default (per BLE-46). English fallback when locale = `en` or when generator fails to find a Bahasa string. Templates are *verbatim from this file* — engineering must not paraphrase. New strings or adaptations require Pastor sign-off via amendment to this doc.
6. **Translation cite required.** Bahasa = TB (Terjemahan Baru). English = NIV by default; ESV for §1 Proverbs 21:23 and §4 1 Cor 13:5; NLT when accessibility matters and Pastor specifies.

---

## Engineering integration

| Surface | Voice | File reference |
|---|---|---|
| Compose-time draft warning | 01 yellow-warm | `ble-26-chat-moderation/index.html` Voice 01 frame |
| Message hidden / account paused notice in thread | 02 cobalt-soft | `ble-26-chat-moderation/index.html` Voice 02 frame |
| Account removed / banned takeover | 03 cream+gold | `ble-26-chat-moderation/index.html` Voice 03 frame |
| Report category sheet (six tags) | n/a — input UI | `ble-27-safety/index.html` F2 / F3 |
| Post-report confirm sheet | 02 cobalt-soft | `ble-27-safety/index.html` F4 |
| Safety center entry | 02 cobalt-soft | `ble-27-safety/index.html` F7 |

Locale keys (proposed under `moderation.*` in `ble-46-i18n/locales/{id,en}.json`):

```
moderation.compose.offPlatform.title
moderation.compose.offPlatform.body
moderation.compose.offPlatform.editCta
moderation.compose.offPlatform.sendAnyway
moderation.postAction.messageHidden.financial.title
moderation.postAction.messageHidden.financial.body
moderation.postAction.appealLine
moderation.ban.fakeProfile.title
moderation.ban.fakeProfile.body
moderation.ban.door.label
moderation.ban.door.body
moderation.ban.scripture.eph_4_25
moderation.ban.appealCta
... etc per category × tier
```

Pastor sign-off attaches to each key. Engineer pulls strings via i18n hook; never inline.

---

## Pastor checklist

- [ ] Ratify three-voice §10 spec (or rewrite the visual/voice rules).
- [ ] Approve bilingual templates §1–§6 above (or correct TB translations).
- [ ] Confirm scripture choices for ban-tier (Eph 4:25 / Prov 12:22 / James 3:9-10 / Heb 13:5 / Prov 13:11 / 1 Tim 4:16 / Matt 7:15).
- [ ] Confirm convert-from-Islam blanket rule is correctly translated to "copy layer never reveals origin flag".
- [ ] Sign off in BLE-31 thread referencing this file's revision SHA.

When ratified, BLE-26 / BLE-27 close on next iteration. Mockups will be updated to match any rewrites.

---

*"Saudara-saudara, kalaupun seorang kedapatan melakukan suatu pelanggaran, maka kamu yang rohani, harus memimpin orang itu ke jalan yang benar dalam roh lemah lembut, sambil menjaga dirimu sendiri, supaya kamu juga jangan kena pencobaan."* — Galatia 6:1 (TB)

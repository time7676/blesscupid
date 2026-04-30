/**
 * String IDs for the onboarding flow. Inline string literals are forbidden in
 * onboarding screens — Pastor-locked copy. Add a lint rule that flags any
 * top-level string literal in `app/onboarding/**` outside of test IDs.
 *
 * Source of truth: Pastor-approved Bahasa copy. English values are
 * placeholders for review; Pastor must sign off before ship.
 */

export const STRINGS = {
  // 01 Welcome
  'welcome.title': 'BlessCupid',
  'welcome.tagline': 'Berjumpa dalam terang iman.',
  'welcome.cta': 'Masuk dengan iman',
  'welcome.signin': 'Sudah punya akun? Masuk',

  // 02 Auth
  'auth.title': 'Mari mulai',
  'auth.tab.phone': 'No HP',
  'auth.tab.email': 'Email',
  'auth.phone.placeholder': '0812 ...',
  'auth.phone.error.invalid': 'Nomor HP belum valid.',
  'auth.email.placeholder': 'kamu@email.com',
  'auth.email.error.invalid': 'Format email belum benar.',
  'auth.cta.send': 'Kirim kode',
  'auth.consent': 'Dengan melanjutkan, kamu setuju dengan Syarat & Privasi.',

  // 02b OTP
  'otp.title': 'Masukkan kode',
  'otp.helper': (id: string) => `Kami kirim kode ke ${id}.`,
  'otp.resend': 'Kirim ulang',
  'otp.resend.cooldown': (s: number) => `Kirim ulang dalam ${s}s`,
  'otp.error.wrong': 'Kode salah. Coba lagi.',
  'otp.error.rate': 'Tunggu sebentar sebelum minta kode lagi.',

  // 03 Modes
  'modes.title': 'Apa yang kamu cari?',
  'modes.helper': 'Pilih satu atau lebih.',
  'modes.pacaran.title': 'Pacaran',
  'modes.pacaran.desc': 'Mencari pasangan untuk pernikahan dalam terang iman.',
  'modes.persahabatan.title': 'Persahabatan',
  'modes.persahabatan.desc': 'Bertemu teman seiman.',
  'modes.komunitas.title': 'Komunitas',
  'modes.komunitas.desc': 'Bergabung dalam grup pelayanan & kelompok kecil.',
  'modes.cta': 'Lanjut',

  // 04 Faith statement
  'covenant.title': 'Janji bersama',
  'covenant.checkbox': 'Saya setuju dengan komitmen di atas.',
  'covenant.cta': 'Lanjut',

  // 05 Photo
  'photo.title': 'Pilih foto wajah',
  'photo.helper':
    'Foto wajah jelas, tanpa filter berat. Maks 10MB. JPG/PNG/HEIC.',
  'photo.cta.choose': 'Pilih dari galeri',
  'photo.cta.camera': 'Ambil foto',
  'photo.error.size': 'Ukuran foto maks 10MB.',
  'photo.error.format': 'Format tidak didukung.',

  // 06 Selfie liveness
  'selfie.title': 'Verifikasi sebentar',
  'selfie.helper': 'Pastikan kamu adalah dirimu sendiri.',
  'selfie.cta.start': 'Mulai',
  'selfie.error.permission': 'Izinkan kamera untuk melanjutkan.',
  'selfie.error.lowlight': 'Cahaya kurang. Coba di tempat lebih terang.',
  'selfie.error.noface': 'Wajah tidak terdeteksi. Hadap kamera.',
  'selfie.error.budget': 'Verifikasi sedang penuh. Coba lagi nanti.',

  // 07 Faith profile
  'profile.title': 'Kenalkan dirimu',
  'profile.denomination.label': 'Denominasi / aliran',
  'profile.denomination.other': 'Sebutkan denominasi',
  'profile.home_church.label': 'Gereja asal (opsional)',
  'profile.verse.label': 'Ayat favorit',
  'profile.verse.placeholder': '"Sebab Aku ini mengetahui rancangan-rancangan-Ku..."',
  'profile.verse.limit': (n: number) => `${n}/180`,
  'profile.journey.label': 'Perjalanan iman (opsional)',
  'profile.journey.limit': (n: number) => `${n}/500`,
  'profile.serving.label': 'Bidang pelayanan (opsional, maks 5)',
  'profile.cta': 'Lanjut',

  // 07a Marriage timeline
  'timeline.title': 'Rencana pernikahan',
  'timeline.helper': 'Membantu kami mencocokkan dengan tepat.',
  'timeline.opt.within_1y': 'Dalam 1 tahun',
  'timeline.opt.1_to_3y': '1–3 tahun',
  'timeline.opt.over_3y': 'Lebih dari 3 tahun',
  'timeline.opt.unsure': 'Belum yakin',
  'timeline.cta': 'Lanjut',

  // 08 Done
  'done.title': 'Selamat datang',
  'done.cta': 'Mulai jelajahi',
  'done.skip': 'Lewati ke beranda',
} as const;

export type StringKey = keyof typeof STRINGS;

export function t<K extends StringKey>(
  key: K,
  ...args: typeof STRINGS[K] extends (...a: infer A) => string ? A : []
): string {
  const v = STRINGS[key];
  return typeof v === 'function' ? (v as (...a: unknown[]) => string)(...args) : v;
}

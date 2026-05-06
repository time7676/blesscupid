/**
 * BlessCupid — v1 dev seed (idempotent).
 *
 * What it does:
 *   1. Seed the curated 84-verse pool into VerseCache.
 *   2. Seed required PastorApproval rows (verse_seed v1, banned_phrases v1,
 *      covenant v1) so CI deploy gates + local dev don't block.
 *   3. Optionally create dogfooder users from `DOGFOODER_EMAILS`
 *      (comma-separated env var). Each gets a basic Profile placeholder so
 *      mobile login + Today screen render cleanly.
 *
 * Idempotent: every write is an upsert. Safe to run repeatedly.
 *
 * Run:  pnpm -F @blesscupid/api seed
 *
 * NOTE: legacy candidate/match/thread fixtures were dropped in v1-restart;
 * see prisma/seed-mock.ts (separate file) for richer fixtures once the
 * mobile-side onboarding flow stabilises.
 */

import { PrismaClient, Gender, Tradition, WalkStage, MarriageIntent } from '@prisma/client';
import * as argon2 from 'argon2';
import { seedVerses } from '../src/verse/seed-verses.js';

const prisma = new PrismaClient();

const SEED_EMAIL_DOMAIN = 'seed.blesscupid.test';
const SEED_CITY = 'Bali';
const DEFAULT_DOB_ISO = '1995-01-01'; // 30y old → passes age gate

const REQUIRED_APPROVALS = [
  { kind: 'verse_seed' as const, version: 'v1', notes: 'BLE v1 84-verse pool seeded.' },
  { kind: 'banned_phrases' as const, version: 'v1', notes: 'Holy Code banned-phrase v1 baseline.' },
  { kind: 'covenant' as const, version: 'v1', notes: 'Covenant v1 pre-launch text.' },
];

interface DogfooderInput {
  email: string;
  displayName: string;
  password: string;
  gender: Gender;
  seeking: Gender;
}

function parseDogfooders(): DogfooderInput[] {
  const raw = process.env.DOGFOODER_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((email, i) => {
      const local = email.split('@')[0] ?? `dogfooder${i}`;
      return {
        email,
        displayName: capitalize(local.replace(/[._-]+/g, ' ')),
        password: 'devpass123',
        gender: i % 2 === 0 ? Gender.male : Gender.female,
        seeking: i % 2 === 0 ? Gender.female : Gender.male,
      };
    });
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}

async function ensurePastorApprovals(approverUserId: string): Promise<number> {
  let upserted = 0;
  for (const req of REQUIRED_APPROVALS) {
    await prisma.pastorApproval.upsert({
      where: { kind_version: { kind: req.kind, version: req.version } },
      create: {
        kind: req.kind,
        version: req.version,
        approvedBy: approverUserId,
        notes: req.notes,
      },
      update: { notes: req.notes },
    });
    upserted += 1;
  }
  return upserted;
}

async function ensureSystemApprover(): Promise<string> {
  const email = `pastor-approver@${SEED_EMAIL_DOMAIN}`;
  const passwordHash = await argon2.hash('seedonly');
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      dob: new Date(DEFAULT_DOB_ISO),
      ageVerifiedAdult: true,
      role: 'admin',
      onboardingCompleted: true,
      countryCode: 'ID',
      timezone: 'Asia/Makassar',
      localePreference: 'en',
    },
    update: {},
    select: { id: true },
  });
  return user.id;
}

async function ensureDogfooder(input: DogfooderInput): Promise<string> {
  const passwordHash = await argon2.hash(input.password);
  const user = await prisma.user.upsert({
    where: { email: input.email },
    create: {
      email: input.email,
      passwordHash,
      dob: new Date(DEFAULT_DOB_ISO),
      ageVerifiedAdult: true,
      onboardingCompleted: false,
      countryCode: 'ID',
      timezone: 'Asia/Makassar',
      localePreference: 'en',
    },
    update: {},
    select: { id: true },
  });

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      displayName: input.displayName,
      gender: input.gender,
      seeking: input.seeking,
      city: SEED_CITY,
      countryCode: 'ID',
      lat: -8.65,
      lng: 115.22,
      tradition: Tradition.catholic,
      walkStage: WalkStage.growing,
      marriageIntent: MarriageIntent.maybe,
      whimsicalAnswers: {},
      onboardingStep: 0,
    },
    update: {},
  });

  return user.id;
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('seed.ts refuses to run with NODE_ENV=production');
  }

  // 1. Verse pool ---------------------------------------------------------
  const verseStats = await seedVerses(prisma);
  console.log(
    `[seed] verses: en=${verseStats.enUpserted} id=${verseStats.idUpserted}`,
  );

  // 2. PastorApproval rows -----------------------------------------------
  const approverId = await ensureSystemApprover();
  const approvals = await ensurePastorApprovals(approverId);
  console.log(`[seed] pastor approvals: ${approvals}`);

  // 3. Dogfooders --------------------------------------------------------
  const dogfooders = parseDogfooders();
  for (const d of dogfooders) {
    const id = await ensureDogfooder(d);
    console.log(`[seed] dogfooder: ${d.email} → ${id}`);
  }
  if (dogfooders.length === 0) {
    console.log('[seed] no DOGFOODER_EMAILS set; skipping dogfooder users');
  }

  console.log('[seed] done');
}

main()
  .catch((err) => {
    console.error('[seed] failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

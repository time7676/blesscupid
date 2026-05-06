/**
 * BlessCupid — pre-alpha seed.
 *
 * Creates a small but realistic dataset for tester walkthroughs:
 *   • 1 test user (login as julian@seed.blesscupid.test / testpass123)
 *   • 8 candidate match users with profile + faith + 1 photo each
 *   • 2 active conversation threads with sample messages
 *
 * All seeded records have an email matching `seed+*@blesscupid.test` OR a
 * profile city of "SEED_*" so `prisma/seed-clean.ts` can wipe them safely
 * before launch. NEVER seed production. Guarded by NODE_ENV check.
 *
 * Run:    pnpm -F @blesscupid/api seed
 * Wipe:   pnpm -F @blesscupid/api seed:clean
 */

import {
  PrismaClient,
  Tradition,
  WalkStage,
  Gender,
  OnboardingStep,
  Denomination,
  ChurchAttendance,
  MarriageIntent,
  Intent,
  Seeking,
  MarriageOpen,
  PhotoStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const SEED_EMAIL_DOMAIN = 'seed.blesscupid.test';
const SEED_CITY_PREFIX = 'SEED_';

const TEST_USER = {
  email: `julian@${SEED_EMAIL_DOMAIN}`,
  password: 'testpass123',
  displayName: 'Julian',
  city: `${SEED_CITY_PREFIX}Bali`,
  countryCode: 'ID',
  gender: Gender.male,
  bio: 'Walking with one another in faith. Sunday Mass and quiet kitchens.',
  tradition: Tradition.catholic,
  walkStage: WalkStage.lifelong,
};

type CandidateInput = {
  emailLocal: string;
  displayName: string;
  ageYears: number;
  city: string;
  countryCode: string;
  gender: Gender;
  bio: string;
  tradition: Tradition;
  walkStage: WalkStage;
};

const CANDIDATES: CandidateInput[] = [
  {
    emailLocal: 'mariana',
    displayName: 'Mariana',
    ageYears: 28,
    city: `${SEED_CITY_PREFIX}Manila`,
    countryCode: 'PH',
    gender: Gender.female,
    bio: "Catechist at St. Anthony's. Walks every morning, reads the saints, makes too much coffee.",
    tradition: Tradition.catholic,
    walkStage: WalkStage.lifelong,
  },
  {
    emailLocal: 'david',
    displayName: 'David',
    ageYears: 31,
    city: `${SEED_CITY_PREFIX}Singapore`,
    countryCode: 'SG',
    gender: Gender.male,
    bio: 'Software lead by week, choir by Sunday. Curious about everything, talks about Lewis too much.',
    tradition: Tradition.protestant_mainline,
    walkStage: WalkStage.lifelong,
  },
  {
    emailLocal: 'hannah',
    displayName: 'Hannah',
    ageYears: 26,
    city: `${SEED_CITY_PREFIX}Cebu`,
    countryCode: 'PH',
    gender: Gender.female,
    bio: 'ICU nurse, runs every Sunday morning before Mass. Honest, steady, looking for steady.',
    tradition: Tradition.catholic,
    walkStage: WalkStage.returning,
  },
  {
    emailLocal: 'nathan',
    displayName: 'Nathan',
    ageYears: 30,
    city: `${SEED_CITY_PREFIX}Jakarta`,
    countryCode: 'ID',
    gender: Gender.male,
    bio: 'MDiv year 2, plays piano at a small church in South Jakarta. Wants someone who reads, prays, and laughs at bad puns.',
    tradition: Tradition.protestant_reformed,
    walkStage: WalkStage.lifelong,
  },
  {
    emailLocal: 'sophia',
    displayName: 'Sophia',
    ageYears: 27,
    city: `${SEED_CITY_PREFIX}Manila`,
    countryCode: 'PH',
    gender: Gender.female,
    bio: 'Architect, oblate of the Carmelites, climbs every long weekend. Looking for someone who values silence and good design.',
    tradition: Tradition.catholic,
    walkStage: WalkStage.lifelong,
  },
  {
    emailLocal: 'joel',
    displayName: 'Joel',
    ageYears: 33,
    city: `${SEED_CITY_PREFIX}Cebu`,
    countryCode: 'PH',
    gender: Gender.male,
    bio: 'Coach and runner. Came back to faith at 28. Looking for someone to grow old slowly with.',
    tradition: Tradition.protestant_evangelical,
    walkStage: WalkStage.returning,
  },
  {
    emailLocal: 'naomi',
    displayName: 'Naomi',
    ageYears: 29,
    city: `${SEED_CITY_PREFIX}Manila`,
    countryCode: 'PH',
    gender: Gender.female,
    bio: 'Lifelong Catholic. Returning to confession after a long quiet. Curious, not performative.',
    tradition: Tradition.catholic,
    walkStage: WalkStage.returning,
  },
  {
    emailLocal: 'ruth',
    displayName: 'Ruth',
    ageYears: 32,
    city: `${SEED_CITY_PREFIX}Singapore`,
    countryCode: 'SG',
    gender: Gender.female,
    bio: 'Pediatric nurse, choir alto. Slow Sundays, long tables, fewer dishes alone.',
    tradition: Tradition.protestant_mainline,
    walkStage: WalkStage.lifelong,
  },
];

function ageToDob(years: number): Date {
  const now = new Date();
  return new Date(now.getFullYear() - years, now.getMonth(), 15);
}

async function ensureUser(input: CandidateInput | typeof TEST_USER, password: string) {
  const email = 'emailLocal' in input ? `${input.emailLocal}@${SEED_EMAIL_DOMAIN}` : input.email;
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const dob = 'ageYears' in input ? ageToDob(input.ageYears) : ageToDob(32);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      dob,
      ageVerifiedAdult: true,
      emailVerified: true,
      onboardingCompleted: true,
    },
    update: {
      onboardingCompleted: true,
    },
  });

  // Dating-side intent + opposite-sex seeking so the matching pool can pair.
  const seeking: Seeking = input.gender === Gender.male ? Seeking.woman : Seeking.man;

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      displayName: input.displayName,
      gender: input.gender,
      city: input.city,
      countryCode: input.countryCode,
      bio: input.bio,
      bioApproved: true,
      onboardingStep: OnboardingStep.done,
      tradition: input.tradition,
      walkStage: input.walkStage,
      intent: Intent.dating,
      seeking,
      marriageOpen: MarriageOpen.yes,
    },
    update: {
      displayName: input.displayName,
      city: input.city,
      bio: input.bio,
      bioApproved: true,
      tradition: input.tradition,
      walkStage: input.walkStage,
      intent: Intent.dating,
      seeking,
      marriageOpen: MarriageOpen.yes,
    },
  });

  // Approved primary photo so candidate passes matching engine's photoApproved gate.
  const existingPhoto = await prisma.photo.findFirst({ where: { userId: user.id } });
  if (!existingPhoto) {
    await prisma.photo.create({
      data: {
        userId: user.id,
        storageKey: `seed/placeholder-${user.id}`,
        position: 0,
        status: PhotoStatus.approved,
      },
    });
  }

  // Map Tradition → legacy Denomination for back-compat (BLE-124).
  const denomination: Denomination =
    input.tradition === Tradition.catholic
      ? Denomination.catholic
      : input.tradition === Tradition.orthodox
        ? Denomination.orthodox
        : input.tradition === Tradition.other_christian || input.tradition === Tradition.still_figuring
          ? Denomination.other
          : Denomination.protestant;

  await prisma.faithProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      denomination,
      churchAttendance: ChurchAttendance.weekly,
      baptized: true,
      marriageIntent: MarriageIntent.within_2y,
    },
    update: {
      denomination,
      churchAttendance: ChurchAttendance.weekly,
      baptized: true,
      marriageIntent: MarriageIntent.within_2y,
    },
  });

  return user;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed in production. Set NODE_ENV=development.');
  }

  console.log('🌱 BlessCupid pre-alpha seed starting…');

  const me = await ensureUser(TEST_USER, TEST_USER.password);
  console.log(`  ✓ test user: ${TEST_USER.email} / ${TEST_USER.password}`);

  for (const c of CANDIDATES) {
    const u = await ensureUser(c, 'candidate-pass-123');
    console.log(`  ✓ candidate ${c.displayName} (${c.city}) — id ${u.id.slice(0, 8)}`);
  }

  console.log('\n✓ Seed complete.');
  console.log(`\nLogin: ${TEST_USER.email} / ${TEST_USER.password}`);
  console.log('Wipe:  pnpm -F @blesscupid/api seed:clean');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

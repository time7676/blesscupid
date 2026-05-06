/**
 * BlessCupid — alpha mock candidate seed (NO prod guard).
 *
 * Adds a realistic mix of candidates so testers see a full swipe deck on
 * day one instead of an empty deck. Idempotent (upserts by email). Safe
 * to re-run.
 *
 * Composition (24 candidates):
 *   • 12 women (ages 22–34) across PH, SG, ID
 *   • 12 men (ages 24–36) across PH, SG, ID
 *   • Tradition mix: catholic (50%), evangelical, mainline, reformed, orthodox, other
 *   • Walk stage mix: lifelong, returning, exploring
 *   • All bioApproved + onboardingCompleted + 1 approved photo
 *
 * Run on prod:
 *   docker exec blesscupid-api pnpm -F @blesscupid/api seed:mock
 *
 * Wipe (only seeded users — never real users):
 *   pnpm -F @blesscupid/api seed:clean
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
const SEED_DOMAIN = 'seed.blesscupid.test';
const SEED_CITY_PREFIX = 'SEED_';
const PASSWORD = 'mock-pass-alpha-2026';

type Mock = {
  emailLocal: string;
  displayName: string;
  ageYears: number;
  city: string;
  countryCode: string;
  gender: Gender;
  bio: string;
  tradition: Tradition;
  walkStage: WalkStage;
  attendance?: ChurchAttendance;
  marriageIntent?: MarriageIntent;
};

const MOCKS: Mock[] = [
  // === Women ===
  { emailLocal: 'mock-mariana', displayName: 'Mariana', ageYears: 28, city: 'Manila', countryCode: 'PH', gender: Gender.female, bio: "Catechist at St. Anthony's. Walks every morning, reads the saints, makes too much coffee.", tradition: Tradition.catholic, walkStage: WalkStage.lifelong },
  { emailLocal: 'mock-hannah', displayName: 'Hannah', ageYears: 26, city: 'Cebu', countryCode: 'PH', gender: Gender.female, bio: 'ICU nurse, runs every Sunday morning before Mass. Honest, steady, looking for steady.', tradition: Tradition.catholic, walkStage: WalkStage.returning },
  { emailLocal: 'mock-sophia', displayName: 'Sophia', ageYears: 27, city: 'Manila', countryCode: 'PH', gender: Gender.female, bio: 'Architect, oblate of the Carmelites, climbs every long weekend. Looking for someone who values silence and good design.', tradition: Tradition.catholic, walkStage: WalkStage.lifelong },
  { emailLocal: 'mock-naomi', displayName: 'Naomi', ageYears: 29, city: 'Manila', countryCode: 'PH', gender: Gender.female, bio: 'Lifelong Catholic. Returning to confession after a long quiet. Curious, not performative.', tradition: Tradition.catholic, walkStage: WalkStage.returning },
  { emailLocal: 'mock-ruth', displayName: 'Ruth', ageYears: 32, city: 'Singapore', countryCode: 'SG', gender: Gender.female, bio: 'Pediatric nurse, choir alto. Slow Sundays, long tables, fewer dishes alone.', tradition: Tradition.protestant_mainline, walkStage: WalkStage.lifelong },
  { emailLocal: 'mock-esther', displayName: 'Esther', ageYears: 25, city: 'Singapore', countryCode: 'SG', gender: Gender.female, bio: 'Software engineer by day, small group leader Wednesdays. Looking for honest conversations and good coffee.', tradition: Tradition.protestant_evangelical, walkStage: WalkStage.lifelong },
  { emailLocal: 'mock-rebecca', displayName: 'Rebecca', ageYears: 30, city: 'Jakarta', countryCode: 'ID', gender: Gender.female, bio: 'Pediatric doctor, kids ministry volunteer. Loves long walks, banana bread experiments, and Tim Keller sermons.', tradition: Tradition.protestant_reformed, walkStage: WalkStage.lifelong },
  { emailLocal: 'mock-anna', displayName: 'Anna', ageYears: 24, city: 'Bali', countryCode: 'ID', gender: Gender.female, bio: 'Yoga instructor turned worship leader. Came to faith two years ago. Still learning, still in love with grace.', tradition: Tradition.protestant_pentecostal, walkStage: WalkStage.exploring },
  { emailLocal: 'mock-mary', displayName: 'Mary', ageYears: 33, city: 'Davao', countryCode: 'PH', gender: Gender.female, bio: 'Teacher. Three older brothers (one a priest). Patient, loud laugh, kitchen as ministry.', tradition: Tradition.catholic, walkStage: WalkStage.lifelong },
  { emailLocal: 'mock-grace', displayName: 'Grace', ageYears: 27, city: 'Surabaya', countryCode: 'ID', gender: Gender.female, bio: 'Translator + worship team keys. Looking for someone steady, kind, who notices the quiet things.', tradition: Tradition.protestant_evangelical, walkStage: WalkStage.returning },
  { emailLocal: 'mock-eliana', displayName: 'Eliana', ageYears: 22, city: 'Singapore', countryCode: 'SG', gender: Gender.female, bio: 'University senior, philosophy major, baptized at 19. Curious about Orthodoxy lately. Long walks > clubs.', tradition: Tradition.orthodox, walkStage: WalkStage.exploring },
  { emailLocal: 'mock-julia', displayName: 'Julia', ageYears: 31, city: 'Bandung', countryCode: 'ID', gender: Gender.female, bio: 'Industrial designer + cell group host. Walking with Christ since 16. Looking for honest, joyful, prayerful.', tradition: Tradition.protestant_mainline, walkStage: WalkStage.lifelong },
  // === Men ===
  { emailLocal: 'mock-david', displayName: 'David', ageYears: 31, city: 'Singapore', countryCode: 'SG', gender: Gender.male, bio: 'Software lead by week, choir by Sunday. Curious about everything, talks about Lewis too much.', tradition: Tradition.protestant_mainline, walkStage: WalkStage.lifelong },
  { emailLocal: 'mock-nathan', displayName: 'Nathan', ageYears: 30, city: 'Jakarta', countryCode: 'ID', gender: Gender.male, bio: 'MDiv year 2, plays piano at a small church in South Jakarta. Wants someone who reads, prays, and laughs at bad puns.', tradition: Tradition.protestant_reformed, walkStage: WalkStage.lifelong },
  { emailLocal: 'mock-joel', displayName: 'Joel', ageYears: 33, city: 'Cebu', countryCode: 'PH', gender: Gender.male, bio: 'Coach and runner. Came back to faith at 28. Looking for someone to grow old slowly with.', tradition: Tradition.protestant_evangelical, walkStage: WalkStage.returning },
  { emailLocal: 'mock-luke', displayName: 'Luke', ageYears: 29, city: 'Manila', countryCode: 'PH', gender: Gender.male, bio: 'Pediatric resident, lector at the 7am Mass. Tired but happy. Looking for steady company and shared faith.', tradition: Tradition.catholic, walkStage: WalkStage.lifelong },
  { emailLocal: 'mock-paul', displayName: 'Paul', ageYears: 35, city: 'Singapore', countryCode: 'SG', gender: Gender.male, bio: 'Architect, deacon-track, kayak weekends. Patient, observant, occasionally too quiet at parties.', tradition: Tradition.protestant_mainline, walkStage: WalkStage.lifelong },
  { emailLocal: 'mock-mark', displayName: 'Mark', ageYears: 27, city: 'Bali', countryCode: 'ID', gender: Gender.male, bio: 'Surf instructor, baptized last Easter. Honest about being new, eager to grow. Coffee + scripture before sunrise.', tradition: Tradition.protestant_pentecostal, walkStage: WalkStage.exploring },
  { emailLocal: 'mock-john', displayName: 'John', ageYears: 32, city: 'Jakarta', countryCode: 'ID', gender: Gender.male, bio: 'Investment analyst by day, soccer coach Saturdays. Reformed, reading, thinking about marriage.', tradition: Tradition.protestant_reformed, walkStage: WalkStage.lifelong },
  { emailLocal: 'mock-james', displayName: 'James', ageYears: 26, city: 'Manila', countryCode: 'PH', gender: Gender.male, bio: 'Civil engineer, youth ministry. Slow on text, fast on calls. Walking with Christ since college.', tradition: Tradition.catholic, walkStage: WalkStage.lifelong },
  { emailLocal: 'mock-michael', displayName: 'Michael', ageYears: 34, city: 'Cebu', countryCode: 'PH', gender: Gender.male, bio: 'School principal. Returning to faith after a hard decade. Honest, awkward, hopeful.', tradition: Tradition.catholic, walkStage: WalkStage.returning },
  { emailLocal: 'mock-andrew', displayName: 'Andrew', ageYears: 28, city: 'Singapore', countryCode: 'SG', gender: Gender.male, bio: 'Trauma surgeon resident. Sundays are sacred. Looking for someone steady through long shifts.', tradition: Tradition.protestant_evangelical, walkStage: WalkStage.lifelong },
  { emailLocal: 'mock-thomas', displayName: 'Thomas', ageYears: 36, city: 'Surabaya', countryCode: 'ID', gender: Gender.male, bio: 'High school history teacher. Mid-30s, never married, prayerful and ready. Late-night reader of theology.', tradition: Tradition.orthodox, walkStage: WalkStage.lifelong },
  { emailLocal: 'mock-peter', displayName: 'Peter', ageYears: 24, city: 'Bandung', countryCode: 'ID', gender: Gender.male, bio: 'Fresh grad, marketing job, just stopped clubbing. New to walking with the Lord. Honest about it.', tradition: Tradition.protestant_evangelical, walkStage: WalkStage.exploring },
];

function ageToDob(years: number): Date {
  const now = new Date();
  return new Date(now.getFullYear() - years, now.getMonth(), 15);
}

async function ensureMock(input: Mock) {
  const email = `${input.emailLocal}@${SEED_DOMAIN}`;
  const passwordHash = await argon2.hash(PASSWORD, { type: argon2.argon2id });
  const dob = ageToDob(input.ageYears);

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
    update: { onboardingCompleted: true },
  });

  const seeking: Seeking = input.gender === Gender.male ? Seeking.woman : Seeking.man;

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      displayName: input.displayName,
      gender: input.gender,
      city: `${SEED_CITY_PREFIX}${input.city}`,
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
      city: `${SEED_CITY_PREFIX}${input.city}`,
      bio: input.bio,
      bioApproved: true,
      tradition: input.tradition,
      walkStage: input.walkStage,
      intent: Intent.dating,
      seeking,
      marriageOpen: MarriageOpen.yes,
    },
  });

  const existingPhoto = await prisma.photo.findFirst({ where: { userId: user.id } });
  if (!existingPhoto) {
    await prisma.photo.create({
      data: {
        userId: user.id,
        storageKey: `seed/mock-${user.id}`,
        position: 0,
        status: PhotoStatus.approved,
      },
    });
  }

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
      churchAttendance: input.attendance ?? ChurchAttendance.weekly,
      baptized: true,
      marriageIntent: input.marriageIntent ?? MarriageIntent.within_2y,
    },
    update: {
      denomination,
      churchAttendance: input.attendance ?? ChurchAttendance.weekly,
      baptized: true,
      marriageIntent: input.marriageIntent ?? MarriageIntent.within_2y,
    },
  });

  return user;
}

async function main() {
  console.log(`🌱 BlessCupid mock candidate seed — ${MOCKS.length} profiles…`);
  for (const m of MOCKS) {
    const u = await ensureMock(m);
    console.log(`  ✓ ${m.displayName.padEnd(10)} (${m.gender}, ${m.ageYears}y, ${m.city.padEnd(10)}) — ${u.id.slice(0, 8)}`);
  }
  console.log(`\n✓ Mock seed complete. ${MOCKS.length} candidates ready.`);
}

main()
  .catch((e) => {
    console.error('Mock seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

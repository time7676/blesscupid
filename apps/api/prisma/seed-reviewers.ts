/**
 * BlessCupid — alpha "reviewer" decoy accounts.
 *
 * These are NOT test data. They are part of the alpha launch infrastructure:
 * decoy accounts that auto-mutual-match every new tester, so the very first
 * mutual-match + chat thread experience is guaranteed within minutes of
 * onboarding completion. Without these the first 1-2 testers would land on a
 * deserted swipe deck and bounce.
 *
 * Reviewer email pattern: `reviewer-N@seed.blesscupid.test`
 *
 * The MatchingService.recordDecision() hook detects this pattern and writes
 * the reverse MatchDecision when the viewer likes/favorites a reviewer, so
 * mutual match unlocks instantly.
 *
 * Run on prod (idempotent — re-runs are safe):
 *   docker exec blesscupid-api pnpm -F @blesscupid/api seed:reviewers
 *
 * Disable auto-match: unset `ALPHA_AUTO_LIKE` env var (or set to anything
 * other than '1') in the container env. Reviewer accounts will linger in
 * the swipe deck like normal candidates — passive, no auto-match.
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

const REVIEWER_DOMAIN = 'seed.blesscupid.test';
const REVIEWER_PASSWORD = 'reviewer-pass-alpha-2026';

type ReviewerInput = {
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

// Mix covers both common dating intents:
//   - 2 female reviewers (so M-seeking-W tester always gets a reviewer match)
//   - 1 male reviewer (so F-seeking-M tester gets a reviewer match)
// Bios stay generic + warm, no claims of human reply.
const REVIEWERS: ReviewerInput[] = [
  {
    emailLocal: 'reviewer-1',
    displayName: 'Sister Maria',
    ageYears: 29,
    city: 'SEED_Manila',
    countryCode: 'PH',
    gender: Gender.female,
    bio: 'Walking with the Lord one prayer at a time. Welcoming early testers — chat me to share feedback on your BlessCupid experience.',
    tradition: Tradition.catholic,
    walkStage: WalkStage.lifelong,
  },
  {
    emailLocal: 'reviewer-2',
    displayName: 'Sister Grace',
    ageYears: 31,
    city: 'SEED_Singapore',
    countryCode: 'SG',
    gender: Gender.female,
    bio: 'Welcoming new arrivals to BlessCupid. Tap "send" to share what felt right, what felt off, what you wish was here.',
    tradition: Tradition.protestant_evangelical,
    walkStage: WalkStage.lifelong,
  },
  {
    emailLocal: 'reviewer-3',
    displayName: 'Brother John',
    ageYears: 32,
    city: 'SEED_Cebu',
    countryCode: 'PH',
    gender: Gender.male,
    bio: 'Welcoming sister-testers to the alpha. Chat me to share your first-impressions feedback. Walking the journey of faith alongside you.',
    tradition: Tradition.catholic,
    walkStage: WalkStage.returning,
  },
];

function ageToDob(years: number): Date {
  const now = new Date();
  return new Date(now.getFullYear() - years, now.getMonth(), 15);
}

async function ensureReviewer(input: ReviewerInput) {
  const email = `${input.emailLocal}@${REVIEWER_DOMAIN}`;
  const passwordHash = await argon2.hash(REVIEWER_PASSWORD, { type: argon2.argon2id });
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
    update: {
      onboardingCompleted: true,
    },
  });

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

  const existingPhoto = await prisma.photo.findFirst({ where: { userId: user.id } });
  if (!existingPhoto) {
    await prisma.photo.create({
      data: {
        userId: user.id,
        storageKey: `seed/reviewer-${user.id}`,
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
  console.log('🌱 BlessCupid alpha reviewer-decoy seed starting…');
  console.log(`   ALPHA_AUTO_LIKE = ${process.env.ALPHA_AUTO_LIKE ?? '(unset — auto-match disabled)'}`);

  for (const r of REVIEWERS) {
    const u = await ensureReviewer(r);
    console.log(`  ✓ reviewer ${r.displayName} (${r.city}) — id ${u.id.slice(0, 8)}`);
  }

  console.log('\n✓ Reviewer seed complete.');
  console.log('   Reviewers will appear in every tester\'s swipe deck.');
  console.log('   When a tester likes/favorites a reviewer, MatchingService writes the reverse');
  console.log('   MatchDecision automatically (gated on ALPHA_AUTO_LIKE=1) so chat unlocks.');
}

main()
  .catch((e) => {
    console.error('Reviewer seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

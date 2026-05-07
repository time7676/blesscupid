/**
 * BlessCupid v1 — alpha "reviewer" decoy accounts.
 *
 * Decoy accounts that auto-mutual-match every new tester. Backend
 * MatchingService.recordDecision detects reviewer-*@seed.blesscupid.test
 * candidates and writes the reverse MatchDecision when ALPHA_AUTO_LIKE=1.
 *
 * Run on prod:
 *   docker exec -e ALPHA_AUTO_LIKE=1 blesscupid-api pnpm -F @blesscupid/api seed:reviewers
 */

import {
  PrismaClient,
  Tradition,
  WalkStage,
  Gender,
  MarriageIntent,
  PhotoStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();
const REVIEWER_DOMAIN = 'seed.blesscupid.test';
const REVIEWER_PASSWORD = 'reviewer-pass-alpha-2026';

type Reviewer = {
  emailLocal: string;
  displayName: string;
  ageYears: number;
  city: string;
  countryCode: string;
  lat: number;
  lng: number;
  gender: Gender;
  bio: string;
  tradition: Tradition;
  walkStage: WalkStage;
};

const REVIEWERS: Reviewer[] = [
  {
    emailLocal: 'reviewer-1',
    displayName: 'Sister Maria',
    ageYears: 29,
    city: 'SEED_Manila',
    countryCode: 'PH',
    lat: 14.5995, lng: 120.9842,
    gender: Gender.female,
    bio: 'Walking with the Lord one prayer at a time. Welcoming early testers — chat me to share feedback on your BlessCupid experience.',
    tradition: Tradition.catholic,
    walkStage: WalkStage.rooted,
  },
  {
    emailLocal: 'reviewer-2',
    displayName: 'Sister Grace',
    ageYears: 31,
    city: 'SEED_Singapore',
    countryCode: 'SG',
    lat: 1.3521, lng: 103.8198,
    gender: Gender.female,
    bio: 'Welcoming new arrivals to BlessCupid. Tap "send" to share what felt right, what felt off, what you wish was here.',
    tradition: Tradition.protestant,
    walkStage: WalkStage.rooted,
  },
  {
    emailLocal: 'reviewer-3',
    displayName: 'Brother John',
    ageYears: 32,
    city: 'SEED_Cebu',
    countryCode: 'PH',
    lat: 10.3157, lng: 123.8854,
    gender: Gender.male,
    bio: 'Welcoming sister-testers to the alpha. Chat me to share your first-impressions feedback. Walking the journey of faith alongside you.',
    tradition: Tradition.catholic,
    walkStage: WalkStage.growing,
  },
];

function ageToDob(years: number): Date {
  const now = new Date();
  return new Date(now.getFullYear() - years, now.getMonth(), 15);
}

async function ensureReviewer(r: Reviewer) {
  const email = `${r.emailLocal}@${REVIEWER_DOMAIN}`;
  const passwordHash = await argon2.hash(REVIEWER_PASSWORD, { type: argon2.argon2id });
  const dob = ageToDob(r.ageYears);
  const seekingGender: Gender = r.gender === Gender.male ? Gender.female : Gender.male;

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      dob,
      ageVerifiedAdult: true,
      onboardingCompleted: true,
      countryCode: r.countryCode,
      emailVerifiedAt: new Date(),
    },
    update: {
      onboardingCompleted: true,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      displayName: r.displayName,
      gender: r.gender,
      seeking: seekingGender,
      city: r.city,
      countryCode: r.countryCode,
      lat: r.lat,
      lng: r.lng,
      bio: r.bio,
      bioApprovedAt: new Date(),
      tradition: r.tradition,
      walkStage: r.walkStage,
      marriageIntent: MarriageIntent.yes,
      isVerified: false,
      onboardingStep: 8,
    },
    update: {
      displayName: r.displayName,
      city: r.city,
      bio: r.bio,
      bioApprovedAt: new Date(),
      tradition: r.tradition,
      walkStage: r.walkStage,
      marriageIntent: MarriageIntent.yes,
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

  return user;
}

async function main() {
  console.log('🌱 BlessCupid v1 alpha reviewer-decoy seed…');
  console.log(`   ALPHA_AUTO_LIKE = ${process.env.ALPHA_AUTO_LIKE ?? '(unset)'}`);
  for (const r of REVIEWERS) {
    const u = await ensureReviewer(r);
    console.log(`  ✓ ${r.displayName} (${r.city}) — ${u.id.slice(0, 8)}`);
  }
  console.log('\n✓ Reviewer seed complete.');
}

main()
  .catch((e) => {
    console.error('Reviewer seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

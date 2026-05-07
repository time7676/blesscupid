/**
 * BlessCupid v1 — alpha mock candidate seed.
 *
 * 24 candidates (12 F + 12 M) across PH/SG/ID with mixed traditions and
 * walk stages. Idempotent (upserts by email). NO prod guard — alpha
 * launch needs candidates on prod.
 *
 * Run on prod:
 *   docker exec blesscupid-api pnpm -F @blesscupid/api seed:mock
 *
 * Wipe (only seeded users):
 *   pnpm -F @blesscupid/api seed:clean
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
  // Approximate lat/lng for the matching engine; v1 requires non-null.
  lat: number;
  lng: number;
};

// City coords (rough)
const CITY: Record<string, { lat: number; lng: number; cc: string }> = {
  Manila:   { lat: 14.5995, lng: 120.9842, cc: 'PH' },
  Cebu:     { lat: 10.3157, lng: 123.8854, cc: 'PH' },
  Davao:    { lat:  7.1907, lng: 125.4553, cc: 'PH' },
  Singapore:{ lat:  1.3521, lng: 103.8198, cc: 'SG' },
  Jakarta:  { lat: -6.2088, lng: 106.8456, cc: 'ID' },
  Bali:     { lat: -8.6500, lng: 115.2167, cc: 'ID' },
  Surabaya: { lat: -7.2575, lng: 112.7521, cc: 'ID' },
  Bandung:  { lat: -6.9175, lng: 107.6191, cc: 'ID' },
};

function makeMock(
  emailLocal: string,
  displayName: string,
  ageYears: number,
  city: keyof typeof CITY,
  gender: Gender,
  bio: string,
  tradition: Tradition,
  walkStage: WalkStage,
): Mock {
  const c = CITY[city]!;
  return {
    emailLocal,
    displayName,
    ageYears,
    city,
    countryCode: c.cc,
    gender,
    bio,
    tradition,
    walkStage,
    lat: c.lat,
    lng: c.lng,
  };
}

const MOCKS: Mock[] = [
  // === Women ===
  makeMock('mock-mariana', 'Mariana', 28, 'Manila',    Gender.female, "Catechist at St. Anthony's. Walks every morning, reads the saints, makes too much coffee.", Tradition.catholic,   WalkStage.rooted),
  makeMock('mock-hannah',  'Hannah',  26, 'Cebu',      Gender.female, 'ICU nurse, runs every Sunday morning before Mass. Honest, steady, looking for steady.',     Tradition.catholic,   WalkStage.growing),
  makeMock('mock-sophia',  'Sophia',  27, 'Manila',    Gender.female, 'Architect, oblate of the Carmelites, climbs every long weekend.',                            Tradition.catholic,   WalkStage.rooted),
  makeMock('mock-naomi',   'Naomi',   29, 'Manila',    Gender.female, 'Lifelong Catholic. Returning to confession after a long quiet. Curious, not performative.', Tradition.catholic,   WalkStage.growing),
  makeMock('mock-ruth',    'Ruth',    32, 'Singapore', Gender.female, 'Pediatric nurse, choir alto. Slow Sundays, long tables.',                                    Tradition.protestant, WalkStage.rooted),
  makeMock('mock-esther',  'Esther',  25, 'Singapore', Gender.female, 'Software engineer by day, small group leader Wednesdays.',                                   Tradition.protestant, WalkStage.rooted),
  makeMock('mock-rebecca', 'Rebecca', 30, 'Jakarta',   Gender.female, 'Pediatric doctor, kids ministry volunteer. Loves long walks and Tim Keller sermons.',        Tradition.protestant, WalkStage.rooted),
  makeMock('mock-anna',    'Anna',    24, 'Bali',      Gender.female, 'Yoga instructor turned worship leader. Came to faith two years ago. Still learning.',       Tradition.protestant, WalkStage.seeking),
  makeMock('mock-mary',    'Mary',    33, 'Davao',     Gender.female, 'Teacher. Three older brothers (one a priest). Patient, loud laugh, kitchen as ministry.',   Tradition.catholic,   WalkStage.rooted),
  makeMock('mock-grace',   'Grace',   27, 'Surabaya',  Gender.female, 'Translator + worship team keys. Looking for someone steady, kind, who notices quiet things.',Tradition.protestant, WalkStage.growing),
  makeMock('mock-eliana',  'Eliana',  22, 'Singapore', Gender.female, 'University senior, philosophy major, baptized at 19. Curious about Orthodoxy.',              Tradition.orthodox,   WalkStage.seeking),
  makeMock('mock-julia',   'Julia',   31, 'Bandung',   Gender.female, 'Industrial designer + cell group host. Walking with Christ since 16.',                       Tradition.protestant, WalkStage.rooted),
  // === Men ===
  makeMock('mock-david',   'David',   31, 'Singapore', Gender.male,   'Software lead by week, choir by Sunday. Curious about everything, talks about Lewis too much.', Tradition.protestant, WalkStage.rooted),
  makeMock('mock-nathan',  'Nathan',  30, 'Jakarta',   Gender.male,   'MDiv year 2, plays piano at a small church in South Jakarta.',                                Tradition.protestant, WalkStage.rooted),
  makeMock('mock-joel',    'Joel',    33, 'Cebu',      Gender.male,   'Coach and runner. Came back to faith at 28. Looking for someone to grow old slowly with.',  Tradition.protestant, WalkStage.growing),
  makeMock('mock-luke',    'Luke',    29, 'Manila',    Gender.male,   'Pediatric resident, lector at the 7am Mass. Tired but happy.',                              Tradition.catholic,   WalkStage.rooted),
  makeMock('mock-paul',    'Paul',    35, 'Singapore', Gender.male,   'Architect, deacon-track, kayak weekends. Patient, observant.',                              Tradition.protestant, WalkStage.rooted),
  makeMock('mock-mark',    'Mark',    27, 'Bali',      Gender.male,   'Surf instructor, baptized last Easter. Honest about being new, eager to grow.',             Tradition.protestant, WalkStage.seeking),
  makeMock('mock-john',    'John',    32, 'Jakarta',   Gender.male,   'Investment analyst by day, soccer coach Saturdays. Reformed, reading.',                     Tradition.protestant, WalkStage.rooted),
  makeMock('mock-james',   'James',   26, 'Manila',    Gender.male,   'Civil engineer, youth ministry. Slow on text, fast on calls.',                              Tradition.catholic,   WalkStage.rooted),
  makeMock('mock-michael', 'Michael', 34, 'Cebu',      Gender.male,   'School principal. Returning to faith after a hard decade.',                                  Tradition.catholic,   WalkStage.growing),
  makeMock('mock-andrew',  'Andrew',  28, 'Singapore', Gender.male,   'Trauma surgeon resident. Sundays are sacred.',                                                Tradition.protestant, WalkStage.rooted),
  makeMock('mock-thomas',  'Thomas',  36, 'Surabaya',  Gender.male,   'High school history teacher. Mid-30s, never married, prayerful.',                            Tradition.orthodox,   WalkStage.rooted),
  makeMock('mock-peter',   'Peter',   24, 'Bandung',   Gender.male,   'Fresh grad, marketing job, just stopped clubbing. New to walking with the Lord.',            Tradition.protestant, WalkStage.seeking),
];

function ageToDob(years: number): Date {
  const now = new Date();
  return new Date(now.getFullYear() - years, now.getMonth(), 15);
}

async function ensureMock(input: Mock) {
  const email = `${input.emailLocal}@${SEED_DOMAIN}`;
  const passwordHash = await argon2.hash(PASSWORD, { type: argon2.argon2id });
  const dob = ageToDob(input.ageYears);
  const seekingGender: Gender = input.gender === Gender.male ? Gender.female : Gender.male;

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      dob,
      ageVerifiedAdult: true,
      onboardingCompleted: true,
      countryCode: input.countryCode,
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
      displayName: input.displayName,
      gender: input.gender,
      seeking: seekingGender,
      city: `${SEED_CITY_PREFIX}${input.city}`,
      countryCode: input.countryCode,
      lat: input.lat,
      lng: input.lng,
      bio: input.bio,
      bioApprovedAt: new Date(),
      tradition: input.tradition,
      walkStage: input.walkStage,
      marriageIntent: MarriageIntent.yes,
      isVerified: false,
      onboardingStep: 8,
    },
    update: {
      displayName: input.displayName,
      gender: input.gender,
      seeking: seekingGender,
      city: `${SEED_CITY_PREFIX}${input.city}`,
      lat: input.lat,
      lng: input.lng,
      bio: input.bio,
      bioApprovedAt: new Date(),
      tradition: input.tradition,
      walkStage: input.walkStage,
      marriageIntent: MarriageIntent.yes,
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

  return user;
}

async function main() {
  console.log(`🌱 BlessCupid v1 mock candidate seed — ${MOCKS.length} profiles…`);
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

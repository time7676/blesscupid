/**
 * BlessCupid — pre-alpha seed cleanup.
 *
 * Wipes every user with email matching `*@seed.blesscupid.test`. Cascade
 * deletes their profile, faith, photos, sessions, messages, blocks,
 * reports — all relations should drop. Run before launch.
 *
 *   pnpm -F @blesscupid/api seed:clean
 *
 * Refuses to run in production.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_DOMAIN_SUFFIX = '@seed.blesscupid.test';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to clean seed in production.');
  }

  const seeded = await prisma.user.findMany({
    where: { email: { endsWith: SEED_DOMAIN_SUFFIX } },
    select: { id: true, email: true },
  });

  if (seeded.length === 0) {
    console.log('No seed users found. Nothing to clean.');
    return;
  }

  console.log(`Found ${seeded.length} seed users:`);
  for (const u of seeded) console.log(`  - ${u.email}`);

  const ids = seeded.map((u) => u.id);

  // Delete in dependency order. Most child rows have onDelete: Cascade
  // configured in the Prisma schema, so deleting User cascades. We do
  // explicit deletes for tables without cascade (defensive).
  await prisma.message.deleteMany({
    where: { OR: [{ senderUserId: { in: ids } }, { recipientUserId: { in: ids } }] },
  });
  await prisma.block.deleteMany({
    where: { OR: [{ blockerUserId: { in: ids } }, { blockedUserId: { in: ids } }] },
  });
  await prisma.report.deleteMany({
    where: { OR: [{ reporterUserId: { in: ids } }, { reportedUserId: { in: ids } }] },
  });
  await prisma.photo.deleteMany({ where: { userId: { in: ids } } });
  await prisma.faithProfile.deleteMany({ where: { userId: { in: ids } } });
  await prisma.profile.deleteMany({ where: { userId: { in: ids } } });
  await prisma.covenantSignature.deleteMany({ where: { userId: { in: ids } } });
  await prisma.session.deleteMany({ where: { userId: { in: ids } } });
  await prisma.oAuthAccount.deleteMany({ where: { userId: { in: ids } } });

  await prisma.user.deleteMany({ where: { id: { in: ids } } });

  console.log(`✓ Removed ${seeded.length} seed users + related rows.`);
}

main()
  .catch((e) => {
    console.error('Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

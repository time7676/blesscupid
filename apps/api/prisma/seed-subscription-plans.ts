/**
 * Seed the four SubscriptionPlan rows for Bless+ (single tier, 4 cycles).
 *
 * Idempotent — uses upsert on the unique (tier, cycle) constraint.
 * Run standalone:  pnpm tsx prisma/seed-subscription-plans.ts
 * Or via seed.ts which imports `seedSubscriptionPlans()` below.
 */

import { PrismaClient, type SubscriptionCycle } from '@prisma/client';

export interface PlanRow {
  cycle: SubscriptionCycle;
  priceIdr: number;
}

export const BLESSPLUS_PLANS: PlanRow[] = [
  { cycle: 'weekly', priceIdr: 29_000 },
  { cycle: 'monthly', priceIdr: 99_000 },
  { cycle: 'quarterly', priceIdr: 269_000 },
  { cycle: 'yearly', priceIdr: 990_000 },
];

const BLESSPLUS_FEATURES = {
  unlimitedDecisions: true,
  seeWhoBlessedYou: true,
  superBlessesPerDay: 5,
  heartOfWeek: true,
  unlimitedSwipeBack: true,
};

export async function seedSubscriptionPlans(prisma: PrismaClient): Promise<void> {
  for (const p of BLESSPLUS_PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: { tier_cycle: { tier: 'blessplus', cycle: p.cycle } },
      create: {
        tier: 'blessplus',
        cycle: p.cycle,
        priceIdr: p.priceIdr,
        features: BLESSPLUS_FEATURES,
        active: true,
      },
      update: {
        priceIdr: p.priceIdr,
        features: BLESSPLUS_FEATURES,
        active: true,
      },
    });
  }
}

async function runStandalone() {
  const prisma = new PrismaClient();
  try {
    await seedSubscriptionPlans(prisma);
    console.log(`Seeded ${BLESSPLUS_PLANS.length} Bless+ plans.`);
  } finally {
    await prisma.$disconnect();
  }
}

// Run only when invoked directly (not when imported by seed.ts).
const invokedDirectly = (() => {
  try {
    const argv1 = process.argv[1] ?? '';
    return argv1.endsWith('seed-subscription-plans.ts') || argv1.endsWith('seed-subscription-plans.js');
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  runStandalone().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

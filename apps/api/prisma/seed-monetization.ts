import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Seed script for default subscription plans and coin packages.
// Run with: npx tsx prisma/seed-monetization.ts

async function main() {
  // ─── Subscription Plans ─────────────────────────────────────────────
  const plans = [
    {
      tier: 'light',
      cycle: 'monthly',
      priceIdr: 30000,
      features: JSON.stringify({
        swipeLimit: 150,
        superLikes: 5,
        advancedFilter: true,
        rewind: false,
        boost: false,
        messageBeforeMatch: false,
        seeWhoLikedYou: false,
        incognito: false,
        readReceipt: false,
        algorithmPriority: 0,
      }),
      coinBonus: 50,
    },
    {
      tier: 'open',
      cycle: 'monthly',
      priceIdr: 89000,
      features: JSON.stringify({
        swipeLimit: 'unlimited',
        superLikes: 10,
        advancedFilter: true,
        rewind: true,
        boost: false,
        messageBeforeMatch: true,
        seeWhoLikedYou: true,
        incognito: false,
        readReceipt: false,
        algorithmPriority: 1,
      }),
      coinBonus: 150,
    },
    {
      tier: 'deep',
      cycle: 'monthly',
      priceIdr: 159000,
      features: JSON.stringify({
        swipeLimit: 'unlimited',
        superLikes: 'unlimited',
        advancedFilter: true,
        rewind: true,
        boost: true,
        messageBeforeMatch: true,
        seeWhoLikedYou: true,
        incognito: true,
        readReceipt: true,
        algorithmPriority: 2,
      }),
      coinBonus: 300,
    },
    // Quarterly variants
    {
      tier: 'light',
      cycle: 'quarterly',
      priceIdr: 75000,
      features: JSON.stringify({
        swipeLimit: 150,
        superLikes: 5,
        advancedFilter: true,
        rewind: false,
        boost: false,
        messageBeforeMatch: false,
        seeWhoLikedYou: false,
        incognito: false,
        readReceipt: false,
        algorithmPriority: 0,
      }),
      coinBonus: 200,
    },
    {
      tier: 'open',
      cycle: 'quarterly',
      priceIdr: 229000,
      features: JSON.stringify({
        swipeLimit: 'unlimited',
        superLikes: 10,
        advancedFilter: true,
        rewind: true,
        boost: false,
        messageBeforeMatch: true,
        seeWhoLikedYou: true,
        incognito: false,
        readReceipt: false,
        algorithmPriority: 1,
      }),
      coinBonus: 500,
    },
    {
      tier: 'deep',
      cycle: 'quarterly',
      priceIdr: 429000,
      features: JSON.stringify({
        swipeLimit: 'unlimited',
        superLikes: 'unlimited',
        advancedFilter: true,
        rewind: true,
        boost: true,
        messageBeforeMatch: true,
        seeWhoLikedYou: true,
        incognito: true,
        readReceipt: true,
        algorithmPriority: 2,
      }),
      coinBonus: 1000,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: {
        tier_cycle: {
          tier: plan.tier as any,
          cycle: plan.cycle as any,
        },
      },
      update: {},
      create: plan as any,
    });
  }

  // ─── Coin Packages ────────────────────────────────────────────────
  const coinPackages = [
    { coinAmount: 50, bonusCoins: 0, priceIdr: 15000 },
    { coinAmount: 120, bonusCoins: 10, priceIdr: 35000 },
    { coinAmount: 300, bonusCoins: 40, priceIdr: 75000 },
    { coinAmount: 700, bonusCoins: 120, priceIdr: 150000 },
  ];

  for (const pkg of coinPackages) {
    await prisma.coinPackage.create({ data: pkg as any });
  }

  console.log('Seeded monetization data');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

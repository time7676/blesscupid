-- Add monetization schema: subscriptions, coins, payments

-- Enums
CREATE TYPE "SubscriptionTier" AS ENUM ('free', 'light', 'open', 'deep');
CREATE TYPE "BillingCycle" AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'cancelled', 'expired', 'grace_period', 'payment_failed');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded', 'cancelled');
CREATE TYPE "PaymentMethod" AS ENUM ('credit_card', 'ewallet_ovo', 'ewallet_dana', 'ewallet_linkaja', 'ewallet_gopay', 'ewallet_shopeepay', 'direct_debit', 'virtual_account');
CREATE TYPE "CoinTransactionType" AS ENUM ('purchase', 'spend', 'refund', 'grant', 'subscription_bonus');

-- SubscriptionPlan
CREATE TABLE "SubscriptionPlan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tier" "SubscriptionTier" NOT NULL,
    "cycle" "BillingCycle" NOT NULL,
    "priceIdr" INTEGER NOT NULL,
    "xenditPlanId" TEXT,
    "features" JSONB NOT NULL,
    "coinBonus" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SubscriptionPlan_tier_cycle_key" UNIQUE ("tier", "cycle")
);

-- UserSubscription
CREATE TABLE "UserSubscription" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "xenditRecurringId" TEXT,
    "xenditPaymentMethod" TEXT,
    "cancelledAt" TIMESTAMPTZ,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "UserSubscription_userId_status_idx" ON "UserSubscription"("userId", "status");
CREATE INDEX "UserSubscription_expiresAt_status_idx" ON "UserSubscription"("expiresAt", "status");

-- CoinPackage
CREATE TABLE "CoinPackage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coinAmount" INTEGER NOT NULL,
    "bonusCoins" INTEGER NOT NULL DEFAULT 0,
    "priceIdr" INTEGER NOT NULL,
    "xenditProductId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoinPackage_pkey" PRIMARY KEY ("id")
);

-- UserCoinBalance
CREATE TABLE "UserCoinBalance" (
    "userId" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "UserCoinBalance_pkey" PRIMARY KEY ("userId"),
    CONSTRAINT "UserCoinBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CoinTransaction
CREATE TABLE "CoinTransaction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "CoinTransactionType" NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoinTransaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CoinTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CoinTransaction_userId_createdAt_idx" ON "CoinTransaction"("userId", "createdAt" DESC);

-- PaymentTransaction
CREATE TABLE "PaymentTransaction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "amountIdr" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "method" "PaymentMethod",
    "xenditInvoiceId" TEXT,
    "xenditChargeId" TEXT,
    "xenditRecurringId" TEXT,
    "paidAt" TIMESTAMPTZ,
    "failedAt" TIMESTAMPTZ,
    "failureReason" TEXT,
    "refundedAt" TIMESTAMPTZ,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "coinPackageId" UUID,
    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PaymentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentTransaction_coinPackageId_fkey" FOREIGN KEY ("coinPackageId") REFERENCES "CoinPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "PaymentTransaction_userId_status_createdAt_idx" ON "PaymentTransaction"("userId", "status", "createdAt" DESC);
CREATE INDEX "PaymentTransaction_xenditInvoiceId_idx" ON "PaymentTransaction"("xenditInvoiceId");
CREATE INDEX "PaymentTransaction_xenditChargeId_idx" ON "PaymentTransaction"("xenditChargeId");

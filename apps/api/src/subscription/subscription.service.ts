import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { XenditService } from '../payment/xendit.service.js';
import type { SubscriptionCycle, SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const TRIAL_DAYS = 7;

const DEFAULT_PLAN_FEATURES = {
  unlimitedDecisions: true,
  seeWhoBlessedYou: true,
  superBlessesPerDay: 5,
  heartOfWeek: true,
  unlimitedSwipeBack: true,
} as const;

const PLAN_PRICING_IDR: Record<SubscriptionCycle, number> = {
  weekly: 29_000,
  monthly: 99_000,
  quarterly: 269_000,
  yearly: 990_000,
};

export interface SubscriptionDto {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  cycle: SubscriptionCycle | null;
  startedAt: Date | null;
  expiresAt: Date | null;
  trialEndsAt: Date | null;
  cancelledAt: Date | null;
  hasUsedTrial: boolean;
}

export interface PlanDto {
  id: string;
  tier: SubscriptionTier;
  cycle: SubscriptionCycle;
  priceIdr: number;
  priceFormatted: string;
  features: unknown;
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly xendit: XenditService,
  ) {}

  /** All active Bless+ plans (4 cycles). */
  async getPlans(): Promise<PlanDto[]> {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { tier: 'blessplus', active: true },
      orderBy: [{ cycle: 'asc' }],
    });
    return plans.map((p) => ({
      id: p.id,
      tier: p.tier,
      cycle: p.cycle,
      priceIdr: p.priceIdr,
      priceFormatted: this.formatIdr(p.priceIdr),
      features: p.features,
    }));
  }

  /**
   * Current subscription for a user. Returns a synthetic free/active row when
   * no UserSubscription exists yet.
   */
  async getCurrentSubscription(userId: string): Promise<SubscriptionDto> {
    const sub = await this.prisma.userSubscription.findUnique({ where: { userId } });
    const hasUsedTrial = await this.hasUsedTrial(userId);
    if (!sub) {
      return {
        tier: 'free',
        status: 'active',
        cycle: null,
        startedAt: null,
        expiresAt: null,
        trialEndsAt: null,
        cancelledAt: null,
        hasUsedTrial,
      };
    }
    return {
      tier: sub.tier,
      status: sub.status,
      cycle: sub.cycle,
      startedAt: sub.startedAt,
      expiresAt: sub.expiresAt,
      trialEndsAt: sub.trialEndsAt,
      cancelledAt: sub.cancelledAt,
      hasUsedTrial,
    };
  }

  /** Lightweight tier read used by matching/chat quota gates. */
  async getTier(userId: string): Promise<SubscriptionTier> {
    const sub = await this.prisma.userSubscription.findUnique({
      where: { userId },
      select: { tier: true, status: true, expiresAt: true },
    });
    if (!sub) return 'free';
    // expired / cancelled-past-period → free
    if (sub.status === 'expired') return 'free';
    if (
      sub.status === 'cancelled' &&
      sub.expiresAt &&
      sub.expiresAt.getTime() < Date.now()
    ) {
      return 'free';
    }
    return sub.tier;
  }

  /**
   * Start a 7-day Bless+ trial. Eligibility: user has never had a paid /
   * trial subscription transaction before (one trial per user).
   */
  async startTrial(userId: string, cycle: SubscriptionCycle): Promise<SubscriptionDto> {
    if (!isValidCycle(cycle)) throw new BadRequestException({ code: 'invalid_cycle' });

    const existing = await this.prisma.userSubscription.findUnique({ where: { userId } });
    if (existing && existing.tier === 'blessplus') {
      throw new ConflictException({ code: 'already_subscribed' });
    }
    if (await this.hasUsedTrial(userId)) {
      throw new ConflictException({ code: 'trial_already_used' });
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { tier_cycle: { tier: 'blessplus', cycle } },
    });
    if (!plan || !plan.active) throw new NotFoundException({ code: 'plan_not_found' });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) throw new NotFoundException({ code: 'user_not_found' });

    const externalId = `sub-trial-${userId}-${Date.now()}`;
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 86_400_000);

    const recurring = await this.xendit.createRecurring({
      externalId,
      amountIdr: plan.priceIdr,
      cycle,
      payerEmail: user.email,
      description: `Bless+ ${cycle} (7-day trial)`,
      firstChargeAfterDays: TRIAL_DAYS,
      metadata: { userId, kind: 'trial' },
    });

    const now = new Date();
    const sub = await this.prisma.userSubscription.upsert({
      where: { userId },
      create: {
        userId,
        tier: 'blessplus',
        status: 'trialing',
        cycle,
        startedAt: now,
        expiresAt: null,
        trialEndsAt,
        xenditRecurringId: recurring.id,
      },
      update: {
        tier: 'blessplus',
        status: 'trialing',
        cycle,
        startedAt: now,
        expiresAt: null,
        trialEndsAt,
        xenditRecurringId: recurring.id,
        cancelledAt: null,
      },
    });

    await this.prisma.paymentTransaction.create({
      data: {
        id: randomUUID(),
        userId,
        type: 'subscription',
        amountIdr: plan.priceIdr,
        status: 'pending',
        method: 'xendit_recurring',
        xenditRecurringId: recurring.id,
        metadata: {
          kind: 'trial',
          cycle,
          externalId,
          trialEndsAt: trialEndsAt.toISOString(),
        },
      },
    });

    this.logger.log(`trial-start user=${userId} cycle=${cycle} recurring=${recurring.id}`);
    return this.toDto(sub, true);
  }

  /**
   * Initiate a paid Bless+ purchase. Returns Xendit hosted checkout URL.
   * Mobile redirects user → Xendit → on success the webhook activates the sub.
   */
  async purchase(userId: string, cycle: SubscriptionCycle): Promise<{
    invoiceId: string;
    checkoutUrl: string;
    amountIdr: number;
    cycle: SubscriptionCycle;
  }> {
    if (!isValidCycle(cycle)) throw new BadRequestException({ code: 'invalid_cycle' });

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { tier_cycle: { tier: 'blessplus', cycle } },
    });
    if (!plan || !plan.active) throw new NotFoundException({ code: 'plan_not_found' });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) throw new NotFoundException({ code: 'user_not_found' });

    const externalId = `sub-${userId}-${Date.now()}`;

    const invoice = await this.xendit.createInvoice({
      externalId,
      amountIdr: plan.priceIdr,
      payerEmail: user.email,
      description: `Bless+ ${cycle}`,
      successRedirectUrl: process.env['XENDIT_SUCCESS_URL'],
      failureRedirectUrl: process.env['XENDIT_FAILURE_URL'],
      metadata: { userId, kind: 'subscription', cycle },
    });

    await this.prisma.paymentTransaction.create({
      data: {
        id: randomUUID(),
        userId,
        type: 'subscription',
        amountIdr: plan.priceIdr,
        status: 'pending',
        method: 'xendit_invoice',
        xenditInvoiceId: invoice.id,
        metadata: {
          kind: 'subscription_purchase',
          cycle,
          externalId,
          checkoutUrl: invoice.invoiceUrl,
        },
      },
    });

    return {
      invoiceId: invoice.id,
      checkoutUrl: invoice.invoiceUrl,
      amountIdr: plan.priceIdr,
      cycle,
    };
  }

  /**
   * Cancel a subscription.
   *  - status='trialing' → IMMEDIATE revert to free. Stops Xendit recurring.
   *  - status='active'   → Honor paid period. Stops future renewals; tier stays
   *                        until expiresAt; cron expires at boundary.
   */
  async cancel(userId: string): Promise<{
    status: SubscriptionStatus;
    revertedNow: boolean;
    expiresAt: Date | null;
  }> {
    const sub = await this.prisma.userSubscription.findUnique({ where: { userId } });
    if (!sub || sub.tier === 'free') {
      throw new NotFoundException({ code: 'no_active_subscription' });
    }

    if (sub.xenditRecurringId) {
      await this.xendit.cancelRecurring(sub.xenditRecurringId);
    }

    if (sub.status === 'trialing') {
      // Immediate revert — no paid period to honor.
      const updated = await this.prisma.userSubscription.update({
        where: { userId },
        data: {
          tier: 'free',
          status: 'cancelled',
          cancelledAt: new Date(),
          expiresAt: new Date(),
          trialEndsAt: null,
        },
      });
      return { status: updated.status, revertedNow: true, expiresAt: updated.expiresAt };
    }

    if (sub.status === 'active' || sub.status === 'grace_period') {
      // Honor paid period — keep tier='blessplus' until expiresAt; cron flips to free.
      const updated = await this.prisma.userSubscription.update({
        where: { userId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          // expiresAt unchanged — that's the contract boundary.
        },
      });
      return { status: updated.status, revertedNow: false, expiresAt: updated.expiresAt };
    }

    // Already cancelled / expired / payment_failed.
    const updated = await this.prisma.userSubscription.update({
      where: { userId },
      data: {
        status: 'cancelled',
        cancelledAt: sub.cancelledAt ?? new Date(),
      },
    });
    return { status: updated.status, revertedNow: false, expiresAt: updated.expiresAt };
  }

  /**
   * Cron job — daily. Flip cancelled-past-period subs to expired/free.
   * Idempotent: re-running is a no-op.
   */
  async expireSubscriptions(): Promise<{ expired: number }> {
    const now = new Date();
    const stale = await this.prisma.userSubscription.findMany({
      where: {
        status: 'cancelled',
        expiresAt: { lt: now, not: null },
        tier: { not: 'free' },
      },
      select: { userId: true },
    });
    if (stale.length === 0) return { expired: 0 };
    await this.prisma.userSubscription.updateMany({
      where: { userId: { in: stale.map((s) => s.userId) } },
      data: { tier: 'free', status: 'expired' },
    });
    this.logger.log(`expireSubscriptions: ${stale.length} subscriptions expired`);
    return { expired: stale.length };
  }

  // ─── Helpers ────────────────────────────────────────────────────

  /**
   * One-trial-per-user gate. Cheaper than scanning all PaymentTransaction —
   * any prior 'trial' metadata or any past trialEndsAt counts. We use the
   * existence of any past PaymentTransaction with metadata.kind='trial' OR
   * a UserSubscription that was ever in trialing state.
   */
  private async hasUsedTrial(userId: string): Promise<boolean> {
    const tx = await this.prisma.paymentTransaction.findFirst({
      where: {
        userId,
        type: 'subscription',
        metadata: { path: ['kind'], equals: 'trial' },
      },
      select: { id: true },
    });
    if (tx) return true;
    const sub = await this.prisma.userSubscription.findUnique({
      where: { userId },
      select: { trialEndsAt: true },
    });
    return Boolean(sub?.trialEndsAt);
  }

  private toDto(
    sub: {
      tier: SubscriptionTier;
      status: SubscriptionStatus;
      cycle: SubscriptionCycle | null;
      startedAt: Date | null;
      expiresAt: Date | null;
      trialEndsAt: Date | null;
      cancelledAt: Date | null;
    },
    hasUsedTrial: boolean,
  ): SubscriptionDto {
    return {
      tier: sub.tier,
      status: sub.status,
      cycle: sub.cycle,
      startedAt: sub.startedAt,
      expiresAt: sub.expiresAt,
      trialEndsAt: sub.trialEndsAt,
      cancelledAt: sub.cancelledAt,
      hasUsedTrial,
    };
  }

  private formatIdr(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}

function isValidCycle(c: unknown): c is SubscriptionCycle {
  return c === 'weekly' || c === 'monthly' || c === 'quarterly' || c === 'yearly';
}

export const SUBSCRIPTION_DEFAULTS = {
  TRIAL_DAYS,
  PLAN_PRICING_IDR,
  DEFAULT_PLAN_FEATURES,
};

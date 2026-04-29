import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async getActivePlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: [
        { tier: 'asc' },
        { cycle: 'asc' },
      ],
    });

    return plans.map((p) => ({
      id: p.id,
      tier: p.tier,
      cycle: p.cycle,
      priceIdr: p.priceIdr,
      priceFormatted: this.formatIdr(p.priceIdr),
      features: p.features,
      coinBonus: p.coinBonus,
    }));
  }

  async getActiveSubscription(userId: string) {
    const sub = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'grace_period'] },
      },
      include: { plan: true },
      orderBy: { expiresAt: 'desc' },
    });

    if (!sub) {
      return { tier: 'free', status: 'active', expiresAt: null };
    }

    return {
      id: sub.id,
      tier: sub.tier,
      status: sub.status,
      cycle: sub.plan.cycle,
      priceIdr: sub.plan.priceIdr,
      expiresAt: sub.expiresAt,
      autoRenew: sub.autoRenew,
      startedAt: sub.startedAt,
    };
  }

  async initiatePurchase(userId: string, planId: string, method: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId, isActive: true },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    // Placeholder: delegate to PaymentService in real implementation
    return {
      planId: plan.id,
      tier: plan.tier,
      amountIdr: plan.priceIdr,
      currency: 'IDR',
      method,
      status: 'pending',
      checkoutUrl: null, // populated by PaymentService
    };
  }

  async cancelSubscription(userId: string, reason?: string) {
    const sub = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
      orderBy: { expiresAt: 'desc' },
    });

    if (!sub) return { cancelled: false, message: 'No active subscription' };

    await this.prisma.userSubscription.update({
      where: { id: sub.id },
      data: {
        autoRenew: false,
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason || null,
      },
    });

    return { cancelled: true, expiresAt: sub.expiresAt };
  }

  private formatIdr(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }
}

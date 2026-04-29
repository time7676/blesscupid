import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CoinService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string) {
    const balance = await this.prisma.userCoinBalance.findUnique({
      where: { userId },
    });
    return { balance: balance?.balance ?? 0 };
  }

  async getActivePackages() {
    const packages = await this.prisma.coinPackage.findMany({
      where: { isActive: true },
      orderBy: { coinAmount: 'asc' },
    });

    return packages.map((pkg) => ({
      id: pkg.id,
      name: this.getPackageName(pkg.coinAmount),
      coinAmount: pkg.coinAmount,
      bonusCoins: pkg.bonusCoins,
      totalCoins: pkg.coinAmount + pkg.bonusCoins,
      priceIdr: pkg.priceIdr,
      priceFormatted: this.formatIdr(pkg.priceIdr),
    }));
  }

  async getTransactions(userId: string) {
    return this.prisma.coinTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async spend(userId: string, amount: number, feature: string, metadata?: Record<string, unknown>) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const balance = await this.prisma.userCoinBalance.findUnique({
      where: { userId },
    });

    const currentBalance = balance?.balance ?? 0;
    if (currentBalance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const newBalance = currentBalance - amount;

    await this.prisma.$transaction([
      this.prisma.userCoinBalance.upsert({
        where: { userId },
        update: { balance: newBalance, updatedAt: new Date() },
        create: { userId, balance: newBalance },
      }),
      this.prisma.coinTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: 'spend',
          balanceAfter: newBalance,
          metadata: metadata ? JSON.stringify(metadata) : undefined,
        },
      }),
    ]);

    return { success: true, newBalance, feature };
  }

  async credit(userId: string, amount: number, type: string, metadata?: Record<string, unknown>) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const balance = await this.prisma.userCoinBalance.findUnique({
      where: { userId },
    });

    const currentBalance = balance?.balance ?? 0;
    const newBalance = currentBalance + amount;

    await this.prisma.$transaction([
      this.prisma.userCoinBalance.upsert({
        where: { userId },
        update: { balance: newBalance, updatedAt: new Date() },
        create: { userId, balance: newBalance },
      }),
      this.prisma.coinTransaction.create({
        data: {
          userId,
          amount,
          type: type as any,
          balanceAfter: newBalance,
          metadata: metadata ? JSON.stringify(metadata) : undefined,
        },
      }),
    ]);

    return { success: true, newBalance };
  }

  private getPackageName(coinAmount: number): string {
    if (coinAmount <= 100) return 'A handful';
    if (coinAmount <= 500) return 'A generous share';
    if (coinAmount <= 1200) return 'An abundant store';
    return 'A full jar';
  }

  private formatIdr(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }
}

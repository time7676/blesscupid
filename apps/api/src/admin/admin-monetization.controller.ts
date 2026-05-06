import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { RolesGuard } from '../common/roles.guard.js';

/**
 * Admin monetization: read/write SubscriptionPlan rows. Single Bless+ tier
 * (4 cycles). Coin packages removed in v1-restart.
 */
@Controller('admin/monetization')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminMonetizationController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('plans')
  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: [{ tier: 'asc' }, { cycle: 'asc' }],
    });
  }

  @Post('plans')
  async createPlan(@Body() body: Record<string, unknown>) {
    return this.prisma.subscriptionPlan.create({ data: body as never });
  }

  @Patch('plans/:id')
  async updatePlan(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: body as never,
    });
  }
}

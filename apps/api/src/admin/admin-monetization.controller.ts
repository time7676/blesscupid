import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { RolesGuard } from '../common/roles.guard.js';

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
    return this.prisma.subscriptionPlan.create({ data: body as any });
  }

  @Patch('plans/:id')
  async updatePlan(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: body as any,
    });
  }

  @Get('packages')
  async getPackages() {
    return this.prisma.coinPackage.findMany({
      orderBy: { coinAmount: 'asc' },
    });
  }

  @Post('packages')
  async createPackage(@Body() body: Record<string, unknown>) {
    return this.prisma.coinPackage.create({ data: body as any });
  }

  @Patch('packages/:id')
  async updatePackage(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.prisma.coinPackage.update({
      where: { id },
      data: body as any,
    });
  }
}

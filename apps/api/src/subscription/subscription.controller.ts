import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service.js';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import type { SubscriptionCycle } from '@prisma/client';

const CYCLES: ReadonlyArray<SubscriptionCycle> = ['weekly', 'monthly', 'quarterly', 'yearly'];

function parseCycle(value: unknown): SubscriptionCycle {
  if (typeof value !== 'string' || !CYCLES.includes(value as SubscriptionCycle)) {
    throw new BadRequestException({ code: 'invalid_cycle', allowed: CYCLES });
  }
  return value as SubscriptionCycle;
}

@Controller('subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  async getPlans() {
    return { plans: await this.subscriptionService.getPlans() };
  }

  @Get('me')
  async getMySubscription(@Req() req: AuthedRequest) {
    return this.subscriptionService.getCurrentSubscription(req.user.userId);
  }

  @Post('start-trial')
  @HttpCode(HttpStatus.CREATED)
  async startTrial(@Req() req: AuthedRequest, @Body() body: { cycle?: unknown }) {
    const cycle = parseCycle(body.cycle);
    return this.subscriptionService.startTrial(req.user.userId, cycle);
  }

  @Post('purchase')
  @HttpCode(HttpStatus.CREATED)
  async purchase(@Req() req: AuthedRequest, @Body() body: { cycle?: unknown }) {
    const cycle = parseCycle(body.cycle);
    return this.subscriptionService.purchase(req.user.userId, cycle);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Req() req: AuthedRequest) {
    return this.subscriptionService.cancel(req.user.userId);
  }
}

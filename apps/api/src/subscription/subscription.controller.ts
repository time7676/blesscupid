import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SubscriptionService } from './subscription.service.js';
import { JwtAuthGuard } from '../auth/jwt.guard.js';

@Controller('subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  async getPlans() {
    return this.subscriptionService.getActivePlans();
  }

  @Get('me')
  async getMySubscription(@Request() req: any) {
    return this.subscriptionService.getActiveSubscription(req.user.sub);
  }

  @Post('purchase')
  async purchase(@Request() req: any, @Body() body: { planId: string; method: string }) {
    return this.subscriptionService.initiatePurchase(req.user.sub, body.planId, body.method);
  }

  @Post('cancel')
  async cancel(@Request() req: any, @Body() body: { reason?: string }) {
    return this.subscriptionService.cancelSubscription(req.user.sub, body.reason);
  }
}

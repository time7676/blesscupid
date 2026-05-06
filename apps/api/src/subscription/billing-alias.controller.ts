/**
 * BillingAliasController — historical mobile path. Maps `/billing/plans` to
 * the canonical /subscription/plans surface. Single Bless+ tier.
 */

import { Controller, Get } from '@nestjs/common';
import { SubscriptionService } from './subscription.service.js';

@Controller('billing')
export class BillingAliasController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  async plans() {
    const plans = await this.subscriptionService.getPlans();
    return {
      plans: [
        {
          id: 'free',
          name: 'Free',
          priceIdr: 0,
          features: [
            '8 decisions per day',
            '1 Super-Bless per day',
            'Daily verse anchor',
            'Verse interlude every 5 swipes',
          ],
        },
        ...plans.map((p) => ({
          id: p.id,
          name: 'Bless+',
          cycle: p.cycle,
          priceIdr: p.priceIdr,
          priceFormatted: p.priceFormatted,
          features: [
            'Unlimited decisions',
            'See who Blessed you',
            '5 Super-Blesses per day',
            'Heart-of-Week feature',
            'Unlimited swipe-to-back undo',
          ],
        })),
      ],
    };
  }
}

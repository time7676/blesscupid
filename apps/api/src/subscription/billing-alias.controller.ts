/**
 * BillingAliasController — mobile uses /billing/* paths historically.
 * Map them to the canonical /subscription/* surface so existing client
 * code keeps working without server-mobile coordination.
 */

import { Controller, Get } from '@nestjs/common';

@Controller('billing')
export class BillingAliasController {
  @Get('plans')
  async plans() {
    // Mirrors /subscription/plans output. Pre-alpha hardcoded tier list.
    return {
      plans: [
        {
          id: 'free',
          name: 'Free',
          priceMonthly: 0,
          features: [
            '8 decisions per day',
            '1 Super-Bless per day',
            'Daily verse anchor',
            'Verse interlude every 5 swipes',
          ],
        },
        {
          id: 'plus',
          name: 'Bless+',
          priceMonthly: 14.99,
          features: [
            'Unlimited decisions',
            'See who Blessed you',
            '5 Super-Blesses per day',
            'Heart-of-Week feature',
            'Unlimited swipe-to-back undo',
          ],
        },
      ],
    };
  }
}

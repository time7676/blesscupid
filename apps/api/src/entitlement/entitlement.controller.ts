import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { EntitlementService, type Action } from './entitlement.service.js';
import { JwtAuthGuard } from '../auth/jwt.guard.js';

@Controller('entitlement')
@UseGuards(JwtAuthGuard)
export class EntitlementController {
  constructor(private readonly entitlementService: EntitlementService) {}

  @Get('can/:action')
  async can(
    @Request() req: { user: { sub: string } },
    @Param('action') action: Action,
  ) {
    return this.entitlementService.can(req.user.sub, action);
  }

  @Get('tier')
  async getTier(@Request() req: { user: { sub: string } }) {
    const tier = await this.entitlementService.getUserTier(req.user.sub);
    return { tier };
  }
}

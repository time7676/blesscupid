import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { CoinService } from './coin.service.js';
import { JwtAuthGuard } from '../auth/jwt.guard.js';

@Controller('coin')
@UseGuards(JwtAuthGuard)
export class CoinController {
  constructor(private readonly coinService: CoinService) {}

  @Get('balance')
  async getBalance(@Request() req: { user: { sub: string } }) {
    return this.coinService.getBalance(req.user.sub);
  }

  @Get('packages')
  async getPackages() {
    return this.coinService.getActivePackages();
  }

  @Get('transactions')
  async getTransactions(@Request() req: { user: { sub: string } }) {
    return this.coinService.getTransactions(req.user.sub);
  }

  @Post('spend')
  async spend(
    @Request() req: { user: { sub: string } },
    @Body() body: { amount: number; feature: string; metadata?: Record<string, unknown> },
  ) {
    return this.coinService.spend(req.user.sub, body.amount, body.feature, body.metadata);
  }
}

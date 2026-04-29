import { Body, Controller, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SubmitKycSchema, ReviewKycSchema } from '@blesscupid/shared';
import { KycService } from './kyc.service.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('kyc')
export class KycController {
  constructor(private readonly kyc: KycService) {}

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  async submit(
    @CurrentUser() userId: string,
    @Body(ZodValidate(SubmitKycSchema)) input: unknown,
  ) {
    return this.kyc.submit(userId, input as never);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@CurrentUser() userId: string) {
    return this.kyc.getStatus(userId);
  }

  @Get('admin/queue')
  @UseGuards(JwtAuthGuard)
  async getQueue() {
    return this.kyc.getPendingQueue();
  }

  @Patch('admin/review/:id')
  @UseGuards(JwtAuthGuard)
  async review(
    @CurrentUser() reviewerId: string,
    @Param('id') id: string,
    @Body(ZodValidate(ReviewKycSchema)) input: unknown,
  ) {
    return this.kyc.review(reviewerId, id, input as never);
  }
}

import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { VerifyPhoneSchema } from '@blesscupid/shared';
import { PhoneAuthService } from './phone-auth.service.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('phone-auth')
export class PhoneAuthController {
  constructor(private readonly phoneAuth: PhoneAuthService) {}

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async verifyPhone(
    @CurrentUser() userId: string,
    @Body(ZodValidate(VerifyPhoneSchema)) input: unknown,
  ) {
    return this.phoneAuth.verifyPhone(userId, input as never);
  }
}

import { Module } from '@nestjs/common';
import { PhoneAuthController } from './phone-auth.controller.js';
import { PhoneAuthService } from './phone-auth.service.js';

@Module({
  controllers: [PhoneAuthController],
  providers: [PhoneAuthService],
  exports: [PhoneAuthService],
})
export class PhoneAuthModule {}

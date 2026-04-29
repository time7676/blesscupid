import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PhoneAuthController } from './phone-auth.controller.js';
import { PhoneAuthService } from './phone-auth.service.js';

@Module({
  imports: [JwtModule.register({})],
  controllers: [PhoneAuthController],
  providers: [PhoneAuthService],
  exports: [PhoneAuthService],
})
export class PhoneAuthModule {}

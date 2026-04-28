import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { TokenService } from './token.service.js';
import { AppleOAuthVerifier } from './oauth/apple.verifier.js';
import { GoogleOAuthVerifier } from './oauth/google.verifier.js';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, TokenService, AppleOAuthVerifier, GoogleOAuthVerifier],
  exports: [AuthService, TokenService],
})
export class AuthModule {}

import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthExtensionController } from './auth-extension.controller.js';
import { AuthService } from './auth.service.js';
import { TokenService } from './token.service.js';
import { AppleOAuthVerifier } from './oauth/apple.verifier.js';
import { GoogleOAuthVerifier } from './oauth/google.verifier.js';

@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController, AuthExtensionController],
  providers: [AuthService, TokenService, AppleOAuthVerifier, GoogleOAuthVerifier],
  exports: [AuthService, TokenService, JwtModule],
})
export class AuthModule {}

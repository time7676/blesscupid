import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { KycController } from './kyc.controller.js';
import { KycService } from './kyc.service.js';

@Module({
  imports: [JwtModule.register({})],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}

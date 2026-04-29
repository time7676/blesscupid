import { Module } from '@nestjs/common';
import { CoinService } from './coin.service.js';
import { CoinController } from './coin.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [CoinService],
  controllers: [CoinController],
  exports: [CoinService],
})
export class CoinModule {}

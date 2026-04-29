import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { VerseCacheService } from './cache.service.js';
import { VerseController } from './verse.controller.js';
import { VerseService } from './verse.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [VerseController],
  providers: [VerseCacheService, VerseService],
  exports: [VerseCacheService, VerseService],
})
export class VerseModule {}

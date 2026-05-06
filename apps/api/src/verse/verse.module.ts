import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { VerseCacheService } from './cache.service.js';
import { VerseController, VerseV1Controller } from './verse.controller.js';
import { VerseService } from './verse.service.js';
import { VerseWarmerService } from './warmer.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [VerseController, VerseV1Controller],
  providers: [VerseCacheService, VerseService, VerseWarmerService],
  exports: [VerseCacheService, VerseService, VerseWarmerService],
})
export class VerseModule {}

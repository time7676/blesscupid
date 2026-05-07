import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { VerseModule } from '../verse/verse.module.js';
import { StatusController } from './status.controller.js';
import { StatusService } from './status.service.js';

@Module({
  imports: [
    PrismaModule,
    VerseModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev-only-secret',
    }),
  ],
  controllers: [StatusController],
  providers: [StatusService],
  exports: [StatusService],
})
export class StatusModule {}

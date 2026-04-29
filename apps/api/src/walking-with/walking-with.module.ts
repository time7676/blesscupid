import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { WalkingWithController } from './walking-with.controller.js';
import { WalkingWithService } from './walking-with.service.js';
import { SealRelationshipsWorker } from './seal-relationships.worker.js';
import { HardDeleteSealedWorker } from './hard-delete-sealed.worker.js';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [WalkingWithController],
  providers: [WalkingWithService, SealRelationshipsWorker, HardDeleteSealedWorker],
  exports: [WalkingWithService, SealRelationshipsWorker, HardDeleteSealedWorker],
})
export class WalkingWithModule {}

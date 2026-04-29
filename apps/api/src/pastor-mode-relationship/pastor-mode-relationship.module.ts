import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PastorModeRelationshipController } from './pastor-mode-relationship.controller.js';
import { PastorModeRelationshipService } from './pastor-mode-relationship.service.js';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [PastorModeRelationshipController],
  providers: [PastorModeRelationshipService],
  exports: [PastorModeRelationshipService],
})
export class PastorModeRelationshipModule {}

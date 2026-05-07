import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ModerationModule } from '../moderation/moderation.module.js';
import { BlocksController } from './blocks.controller.js';
import { BlocksService } from './blocks.service.js';

@Module({
  imports: [ModerationModule, JwtModule.register({})],
  controllers: [BlocksController],
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}

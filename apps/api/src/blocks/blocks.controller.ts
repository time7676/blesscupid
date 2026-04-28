import { Body, Controller, Delete, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { BlocksService } from './blocks.service.js';

const BlockSchema = z.object({ blockedUserId: z.string().uuid() });

@Controller('blocks')
@UseGuards(JwtAuthGuard)
export class BlocksController {
  constructor(private readonly blocks: BlocksService) {}

  @Post()
  @HttpCode(201)
  async block(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(BlockSchema)) input: z.infer<typeof BlockSchema>,
  ) {
    return this.blocks.block(req.user.userId, input.blockedUserId);
  }

  @Delete(':userId')
  @HttpCode(204)
  async unblock(@Req() req: AuthedRequest, @Param('userId') userId: string) {
    await this.blocks.unblock(req.user.userId, userId);
  }
}

import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { BioSchema } from '@blesscupid/shared';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { BioService } from './bio.service.js';

@Controller('me/bio')
@UseGuards(JwtAuthGuard)
export class BioController {
  constructor(private readonly bio: BioService) {}

  @Post()
  @HttpCode(200)
  async update(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(BioSchema)) input: { bio: string },
  ) {
    return this.bio.reclassify(req.user.userId, input.bio);
  }
}

import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { BioService } from './bio.service.js';

// Local schema — `@blesscupid/shared` doesn't ship a BioSchema yet. Keep
// the limit aligned with `ProfilePatchSchema.bio` in account.controller.ts.
const BioSchema = z.object({
  bio: z.string().min(1).max(280),
});

@Controller({ path: 'me/bio', version: '1' })
@UseGuards(JwtAuthGuard)
export class BioController {
  constructor(private readonly bio: BioService) {}

  @Post()
  @HttpCode(200)
  update(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(BioSchema)) input: z.infer<typeof BioSchema>,
  ) {
    return this.bio.reclassify(req.user.userId, input.bio);
  }
}

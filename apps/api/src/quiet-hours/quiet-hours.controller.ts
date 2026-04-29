import { Body, Controller, Get, HttpCode, Put, Req, UseGuards } from '@nestjs/common';
import {
  HOLY_CODE_DEFAULT_WINDOW,
  QuietHoursConfigSchema,
  type QuietHoursConfig,
} from '@blesscupid/shared';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { QuietHoursService } from './quiet-hours.service.js';

/**
 * BLE-129 — settings endpoint to read/override quiet-hours window.
 *
 *   GET  /me/quiet-hours    — current config (falls back to Holy Code default
 *                              when user has never set one).
 *   PUT  /me/quiet-hours    — override with `{ timezone, windows }`.
 */
@Controller('me/quiet-hours')
@UseGuards(JwtAuthGuard)
export class QuietHoursController {
  constructor(private readonly service: QuietHoursService) {}

  @Get()
  async get(@Req() req: AuthedRequest): Promise<QuietHoursConfig | { config: null }> {
    const config = await this.service.loadConfig(req.user.userId);
    return config ?? { config: null };
  }

  @Put()
  @HttpCode(200)
  async put(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(QuietHoursConfigSchema)) input: QuietHoursConfig,
  ): Promise<QuietHoursConfig> {
    return this.service.setConfig(req.user.userId, input);
  }

  @Get('default')
  @HttpCode(200)
  defaults() {
    return { window: HOLY_CODE_DEFAULT_WINDOW };
  }
}

import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { Roles, RolesGuard } from '../common/roles.guard.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { PastorModeGateService } from './pastor-mode-gate.service.js';
import { PastorModeGateTelemetry } from './pastor-mode-gate.telemetry.js';

const VerifyKtpSchema = z
  .object({
    nik: z
      .string()
      .regex(/^\d{16}$/, { message: 'nik_must_be_16_digits' })
      .optional(),
    dobIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'dob_iso_format' }).optional(),
    ocrConfidence: z.number().min(0).max(1).optional(),
  })
  .refine((v) => Boolean(v.nik || v.dobIso), { message: 'nik_or_dob_required' });

const AttestAffidavitSchema = z.object({
  attested: z.boolean(),
  livenessSelfieKey: z.string().min(4).max(512).optional(),
});

@Controller('pastor-mode-gate')
@UseGuards(JwtAuthGuard)
export class PastorModeGateController {
  constructor(private readonly gate: PastorModeGateService) {}

  @Get('status')
  async status(@Req() req: AuthedRequest) {
    return this.gate.getStatus(req.user.userId);
  }

  @Post('verify-ktp')
  @HttpCode(200)
  async verifyKtp(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(VerifyKtpSchema)) input: z.infer<typeof VerifyKtpSchema>,
  ) {
    return this.gate.verifyKtp(req.user.userId, input);
  }

  @Post('attest-affidavit')
  @HttpCode(200)
  async attestAffidavit(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(AttestAffidavitSchema)) input: z.infer<typeof AttestAffidavitSchema>,
  ) {
    return this.gate.attestAffidavit(req.user.userId, input);
  }
}

@Controller('admin/pastor-mode-gate')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('pastor', 'ceo')
export class AdminPastorModeGateController {
  constructor(private readonly telemetry: PastorModeGateTelemetry) {}

  @Get('telemetry')
  async telemetryTile() {
    return this.telemetry.aggregate();
  }
}

// BLE-131 — Pastor-mode relationship HTTP surface.
//
// Endpoints:
//   GET  /pastor-mode/relationships               — audited-side composite
//   GET  /pastor-mode/relationships/pastor        — pastor sidebar (Surface 7)
//   POST /pastor-mode/relationships/invite        — pastor invites audited
//   POST /pastor-mode/relationships/:id/accept    — audited accepts invite
//   POST /pastor-mode/relationships/:id/decline   — audited declines invite
//   POST /pastor-mode/relationships/:id/revoke    — either party ends walk
//
// Auth: all routes require JwtAuthGuard. Role gating happens in-service via
// the actor parameter; we don't tie pastor-side endpoints to UserRole=pastor
// because the v1 product treats "pastor" as a relationship role per pair,
// not a global account role. (Global UserRole.pastor controls the T&S
// queue access, separately.)

import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { PastorModeRelationshipService } from './pastor-mode-relationship.service.js';

const InviteSchema = z.object({
  auditedUserId: z.string().uuid(),
  inviteNote: z.string().max(500).optional(),
});

const RevokeSchema = z.object({
  // 'audited' = audited user revoke flow (Surface 5b).
  // 'pastor'  = pastor steps away (`Mundur`).
  actor: z.enum(['audited', 'pastor']),
});

@Controller('pastor-mode/relationships')
@UseGuards(JwtAuthGuard)
export class PastorModeRelationshipController {
  constructor(private readonly svc: PastorModeRelationshipService) {}

  @Get()
  async listForAudited(@Req() req: AuthedRequest) {
    return this.svc.getAuditedUserView(req.user.userId);
  }

  @Get('pastor')
  async listForPastor(@Req() req: AuthedRequest) {
    const entries = await this.svc.getPastorSidebar(req.user.userId);
    return { entries };
  }

  @Post('invite')
  @HttpCode(201)
  async invite(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(InviteSchema)) input: z.infer<typeof InviteSchema>,
  ) {
    return this.svc.invite({
      pastorUserId: req.user.userId,
      auditedUserId: input.auditedUserId,
      inviteNote: input.inviteNote,
    });
  }

  @Post(':id/accept')
  @HttpCode(200)
  async accept(
    @Req() req: AuthedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.svc.accept({ invitationId: id, auditedUserId: req.user.userId });
  }

  @Post(':id/decline')
  @HttpCode(204)
  async decline(
    @Req() req: AuthedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.svc.decline({ invitationId: id, auditedUserId: req.user.userId });
  }

  @Post(':id/revoke')
  @HttpCode(204)
  async revoke(
    @Req() req: AuthedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(ZodValidate(RevokeSchema)) input: z.infer<typeof RevokeSchema>,
  ) {
    await this.svc.revoke({
      relationshipId: id,
      actorUserId: req.user.userId,
      actor: input.actor,
    });
  }
}

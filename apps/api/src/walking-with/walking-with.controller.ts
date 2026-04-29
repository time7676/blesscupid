import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { WalkingWithService } from './walking-with.service.js';

/**
 * BLE-132 — pastor-side walking-with API.
 *
 *   GET  /walking-with/:relationshipId/transcripts/:threadId
 *        Pastor reads transcript. 403 once the audited user revokes.
 *
 *   GET  /walking-with/journals
 *        Pastor's read-only journal of sealed relationships (own notes).
 *
 *   POST /walking-with/:relationshipId/revoke
 *        Audited user closes the door. Pastor loses transcript access
 *        immediately; visible "Sudah selesai" flip happens at T+24h via
 *        the seal job.
 */
@Controller('walking-with')
@UseGuards(JwtAuthGuard)
export class WalkingWithController {
  constructor(private readonly service: WalkingWithService) {}

  @Get('journals')
  listJournals(@Req() req: AuthedRequest) {
    return this.service.listJournals(req.user.userId);
  }

  @Get(':relationshipId/transcripts/:threadId')
  readTranscript(
    @Req() req: AuthedRequest,
    @Param('relationshipId') relationshipId: string,
    @Param('threadId') threadId: string,
  ) {
    return this.service.readTranscript({
      pastorUserId: req.user.userId,
      relationshipId,
      threadId,
    });
  }

  @Post(':relationshipId/revoke')
  @HttpCode(200)
  revoke(
    @Req() req: AuthedRequest,
    @Param('relationshipId') relationshipId: string,
  ) {
    return this.service.revoke({
      auditedUserId: req.user.userId,
      relationshipId,
    });
  }
}

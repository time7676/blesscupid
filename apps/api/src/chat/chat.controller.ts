import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { ChatService } from './chat.service.js';

const SendMessageSchema = z.object({
  recipientUserId: z.string().uuid(),
  text: z.string().min(1).max(2000),
  attachmentIds: z.array(z.string().uuid()).max(4).optional(),
});

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('threads/:threadId/messages')
  @HttpCode(200)
  async sendMessage(
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
    @Body(ZodValidate(SendMessageSchema)) input: z.infer<typeof SendMessageSchema>,
  ) {
    return this.chat.sendMessage(req.user.userId, {
      threadId,
      recipientUserId: input.recipientUserId,
      text: input.text,
      ...(input.attachmentIds ? { attachmentIds: input.attachmentIds } : {}),
    });
  }

  @Get('threads/:threadId/messages')
  async list(@Req() req: AuthedRequest, @Param('threadId') threadId: string) {
    const messages = await this.chat.listThreadMessages(req.user.userId, threadId);
    return { messages };
  }
}

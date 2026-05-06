// BLE v1-restart — ChatController.
//
// Surface (all auth-required, all under /v1 in main.ts global prefix):
//   GET    /chat/threads
//   GET    /chat/threads/:threadId
//   GET    /chat/threads/:threadId/messages
//   POST   /chat/threads/:threadId/messages
//   GET    /chat/threads/:threadId/suggestions
//   POST   /chat/threads/:threadId/archive
//   DELETE /chat/threads/:threadId/archive

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { ChatService } from './chat.service.js';
import type {
  MessageDto,
  PaginatedMessagesDto,
  PaginatedThreadsDto,
  SuggestionDto,
  ThreadDetailDto,
} from './dtos.js';

// 30 sends per minute per authenticated user.
const SEND_THROTTLE = { message: { limit: 30, ttl: 60_000 } };

const SendMessageSchema = z
  .object({
    body: z.string().min(1).max(2000),
    kind: z.enum(['text', 'verse_share']),
    verseRef: z.string().min(1).max(120).optional(),
    clientMessageId: z.string().uuid(),
  })
  .refine((v) => v.kind !== 'verse_share' || !!v.verseRef, {
    message: 'verseRef required when kind=verse_share',
    path: ['verseRef'],
  });

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('threads')
  async listThreads(
    @Req() req: AuthedRequest,
    @Query('cursor') cursor?: string,
  ): Promise<PaginatedThreadsDto> {
    return this.chat.getThreads(req.user.userId, cursor ?? null);
  }

  @Get('threads/:threadId')
  async getThread(
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
  ): Promise<ThreadDetailDto> {
    return this.chat.getThread(req.user.userId, threadId);
  }

  @Get('threads/:threadId/messages')
  async listMessages(
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
    @Query('cursor') cursor?: string,
  ): Promise<PaginatedMessagesDto> {
    return this.chat.getMessages(req.user.userId, threadId, cursor ?? null);
  }

  @Post('threads/:threadId/messages')
  @HttpCode(200)
  @Throttle(SEND_THROTTLE)
  async sendMessage(
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
    @Body(ZodValidate(SendMessageSchema)) input: z.infer<typeof SendMessageSchema>,
  ): Promise<{ message: MessageDto; duplicated: boolean }> {
    return this.chat.sendMessage({
      threadId,
      senderId: req.user.userId,
      body: input.body,
      kind: input.kind,
      ...(input.verseRef ? { verseRef: input.verseRef } : {}),
      clientMessageId: input.clientMessageId,
    });
  }

  @Get('threads/:threadId/suggestions')
  async getSuggestions(
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
  ): Promise<{ suggestions: SuggestionDto[] }> {
    const suggestions = await this.chat.getSuggestions(req.user.userId, threadId);
    return { suggestions };
  }

  @Post('threads/:threadId/archive')
  @HttpCode(200)
  async archive(
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
  ): Promise<{ archivedAt: string }> {
    return this.chat.archive(req.user.userId, threadId);
  }

  @Delete('threads/:threadId/archive')
  @HttpCode(204)
  async unarchive(
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
  ): Promise<void> {
    await this.chat.unarchive(req.user.userId, threadId);
  }
}

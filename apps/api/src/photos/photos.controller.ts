import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { PhotosService } from './photos.service.js';

const RequestUploadSchema = z.object({
  position: z.number().int().min(0).max(7),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/heic']),
});

@Controller('photos')
@UseGuards(JwtAuthGuard)
export class PhotosController {
  constructor(private readonly photos: PhotosService) {}

  @Get('mine')
  async mine(@Req() req: AuthedRequest) {
    return { items: await this.photos.listMine(req.user.userId) };
  }

  @Post('upload-url')
  @HttpCode(200)
  async requestUpload(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(RequestUploadSchema)) input: unknown,
  ) {
    return this.photos.createUploadUrl(req.user.userId, input as never);
  }

  @Post(':photoId/finalize')
  @HttpCode(200)
  async finalize(@Req() req: AuthedRequest, @Param('photoId') photoId: string) {
    return this.photos.finalize(req.user.userId, photoId);
  }

  @Delete(':photoId')
  @HttpCode(200)
  async remove(@Req() req: AuthedRequest, @Param('photoId') photoId: string) {
    return this.photos.deleteMine(req.user.userId, photoId);
  }
}

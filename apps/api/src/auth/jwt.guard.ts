import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface AuthedRequest extends Request {
  user: { userId: string };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException({ code: 'no_token' });
    const token = header.slice('Bearer '.length);
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new UnauthorizedException({ code: 'server_misconfigured' });
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, { secret });
      req.user = { userId: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException({ code: 'invalid_token' });
    }
  }
}

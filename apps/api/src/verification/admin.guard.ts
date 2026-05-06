import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthedRequest } from '../auth/jwt.guard.js';

/**
 * Simple admin-role gate. Use after JwtAuthGuard.
 * Checks `User.role === 'admin'` in DB on every request.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenException({ error: 'unauthenticated' });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, deletedAt: true, isSuspended: true },
    });

    if (!user || user.deletedAt || user.isSuspended || user.role !== 'admin') {
      throw new ForbiddenException({ error: 'admin_only' });
    }
    return true;
  }
}

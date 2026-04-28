import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthedRequest } from '../auth/jwt.guard.js';

export type AdminRole = 'pastor' | 'ceo';
export const ROLES_KEY = 'roles';

export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Role gate. Use after JwtAuthGuard. Reads `User.role` from the database for
 * the authed userId; deflects anything not in the @Roles(...) allowlist.
 *
 * The role lives in Postgres (UserRole enum) because it's a holy-trust
 * decision — Pastor and CEO are seeded out-of-band, never self-promoted.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required =
      this.reflector.getAllAndOverride<AdminRole[] | undefined>(ROLES_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]) ?? [];
    if (required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenException({ code: 'no_user' });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) throw new ForbiddenException({ code: 'user_not_found' });
    if (!required.includes(user.role as AdminRole)) {
      throw new ForbiddenException({ code: 'forbidden_role', required });
    }
    return true;
  }
}

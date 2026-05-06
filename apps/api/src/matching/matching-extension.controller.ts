/**
 * MatchingExtensionController — endpoints needed by mobile that don't fit the
 * primary MatchingController surface. Pre-alpha additions:
 *
 *   GET  /matches/incoming           — people who Liked the caller (Bless+ gate)
 *   GET  /matches/:id                — single profile detail (post-card-tap)
 *   POST /matches/:id/conversations  — create or fetch existing thread
 *
 * All routes JWT-gated. Returns mobile-shaped payloads.
 */

import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchingExtensionController {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /matches/incoming — users who 'like' or 'favorite'd me. */
  @Get('incoming')
  async incoming(@Req() req: AuthedRequest) {
    const userId = req.user.userId;

    // Find Decisions where the caller is the candidate AND decision is like/favorite.
    // Pre-alpha: read from a Decision model if present, else return empty list.
    // Schema may not have a Decision table on older migrations — guard with try.
    let items: {
      userId: string;
      displayName: string;
      age: number;
      city: string;
      tradition: string | null;
      blessedAt: string;
      blurred: boolean;
    }[] = [];

    try {
      // Best-effort: count + fetch via raw SQL on `Decision` if present.
      // If not, return empty list — mobile will degrade to "no one yet".
      const rows = await this.prisma.$queryRawUnsafe<
        {
          decider_id: string;
          decision: string;
          created_at: Date;
        }[]
      >(
        `SELECT "deciderUserId" as decider_id, decision, "createdAt" as created_at
         FROM "Decision"
         WHERE "candidateUserId" = $1 AND decision IN ('like','favorite')
         ORDER BY "createdAt" DESC
         LIMIT 50`,
        userId,
      );

      if (rows.length > 0) {
        const ids = rows.map((r) => r.decider_id);
        const profiles = await this.prisma.profile.findMany({
          where: { userId: { in: ids } },
          select: {
            userId: true,
            displayName: true,
            city: true,
            tradition: true,
            user: { select: { dob: true } },
          },
        });
        const profileById = new Map(profiles.map((p) => [p.userId, p]));
        items = rows
          .map((r) => {
            const p = profileById.get(r.decider_id);
            if (!p) return null;
            const ageYears = computeAge(p.user.dob);
            return {
              userId: r.decider_id,
              displayName: p.displayName,
              age: ageYears,
              city: p.city,
              tradition: p.tradition,
              blessedAt: r.created_at.toISOString(),
              blurred: true, // tier-gated
            };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null);
      }
    } catch {
      // Decision table missing or query error — return empty list.
      items = [];
    }

    // Tier gate. Pre-alpha: hardcode 'free' until subscription wiring.
    const tier: 'free' | 'plus' | 'plus_trial' = 'free';
    const blurredItems = items.map((it) =>
      tier === 'free' ? { ...it, displayName: '—', blurred: true } : { ...it, blurred: false },
    );

    return {
      count: items.length,
      tier,
      items: blurredItems,
    };
  }

  /** GET /matches/:id — single profile detail. */
  @Get(':id')
  async detail(@Req() req: AuthedRequest, @Param('id') id: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: id },
      include: {
        user: { select: { dob: true } },
      },
    });
    if (!profile) throw new ForbiddenException({ code: 'match_not_found' });

    const photos = await this.prisma.photo.findMany({
      where: { userId: id, status: 'approved' },
      orderBy: { createdAt: 'asc' },
      select: { id: true, storageKey: true },
    });

    return {
      userId: id,
      displayName: profile.displayName,
      age: computeAge(profile.user.dob),
      city: profile.city,
      country: profile.countryCode,
      tradition: profile.tradition,
      walkStage: profile.walkStage,
      bio: profile.bio,
      photos: photos.map((p) => ({ photoId: p.id, storageKey: p.storageKey })),
      prompts: [], // pastor-curated prompts wired in v1.1
    };
  }

  /** POST /matches/:id/conversations — create or return thread between users. */
  @Post(':id/conversations')
  @HttpCode(200)
  async createConversation(@Req() req: AuthedRequest, @Param('id') matchId: string) {
    const me = req.user.userId;
    if (me === matchId) throw new ForbiddenException({ code: 'self_thread' });

    // Compute deterministic threadId from sorted user-pair so creation is idempotent.
    const [a, b] = me < matchId ? [me, matchId] : [matchId, me];
    const threadId = `th_${a.slice(0, 8)}_${b.slice(0, 8)}`;
    return { threadId };
  }
}

function computeAge(dob: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

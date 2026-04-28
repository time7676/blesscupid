import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TextModerationService } from '../moderation/text-moderation.service.js';

@Injectable()
export class BioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly textModeration: TextModerationService,
  ) {}

  /**
   * Re-classify and persist a bio edit. Unlike the onboarding flow, this
   * never advances `onboardingStep` — the user has already finished onboarding.
   * `block` decisions throw and the existing bio is left unchanged.
   */
  async reclassify(userId: string, bio: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException({ code: 'profile_not_found' });

    const moderation = await this.textModeration.classify(bio);
    if (moderation.decision === 'block') {
      throw new BadRequestException({
        code: 'bio_rejected',
        categories: moderation.categories,
      });
    }

    const approved = moderation.decision === 'allow';
    await this.prisma.profile.update({
      where: { userId },
      data: { bio, bioApproved: approved },
    });
    await this.prisma.moderationItem.create({
      data: {
        userId,
        kind: 'text_bio',
        rawContent: bio,
        decision: moderation.decision,
        status: approved ? 'approved' : 'pending',
        categories: moderation.categories,
        provider: moderation.provider,
        rawScore: moderation.rawScore,
      },
    });

    return { ok: true, bioApproved: approved, queuedForReview: !approved };
  }
}

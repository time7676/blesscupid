import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TextModerationService } from '../moderation/text-moderation.service.js';

@Injectable()
export class BioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly textModeration: TextModerationService,
  ) {}

  /**
   * Re-classify and persist a bio edit. Unlike onboarding, this never advances
   * `onboardingStep` — the user has already finished onboarding.
   *
   * Decisions:
   *   allow  → write bio, stamp `bioApprovedAt = now`, no queue row.
   *   review → write bio, clear `bioApprovedAt`, push a ModerationQueueItem.
   *   block  → throw 400; existing bio left unchanged.
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
      data: { bio, bioApprovedAt: approved ? new Date() : null },
    });

    if (!approved) {
      await this.prisma.moderationQueueItem.create({
        data: {
          kind: 'text_bio',
          decision: moderation.decision,
          reasons: moderation.categories,
          flags: [],
          rawScores: { score: moderation.rawScore, provider: moderation.provider },
          senderUserId: userId,
          bodyText: bio,
        },
      });
    }

    return {
      ok: true,
      bioApproved: approved,
      queuedForReview: !approved,
    };
  }
}

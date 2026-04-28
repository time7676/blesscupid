import { BadRequestException, Injectable } from '@nestjs/common';
import {
  COVENANT_VERSION,
  nextStep,
  type BioInput,
  type CovenantAcceptInput,
  type FaithQuestionnaireInput,
  type ProfileBasicsInput,
} from '@blesscupid/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { TextModerationService } from '../moderation/text-moderation.service.js';
import type { Request } from 'express';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly textModeration: TextModerationService,
  ) {}

  async getState(userId: string) {
    const [user, profile, faith, covenant, photoCount] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      this.prisma.profile.findUnique({ where: { userId } }),
      this.prisma.faithProfile.findUnique({ where: { userId } }),
      this.prisma.covenantSignature.findFirst({
        where: { userId, version: COVENANT_VERSION },
      }),
      this.prisma.photo.count({ where: { userId, status: { in: ['approved', 'uploaded', 'processing'] } } }),
    ]);

    const snapshot = {
      ageVerifiedAdult: user.ageVerifiedAdult,
      covenantSigned: !!covenant,
      faithComplete: !!faith,
      profileComplete: !!profile,
      hasPhoto: photoCount > 0,
      bioApproved: profile?.bioApproved ?? false,
    };

    return {
      ...snapshot,
      onboardingStep: profile?.onboardingStep ?? 'age_gate',
      // Server-authoritative next step. Mobile must route to this after signup
      // and after each onboarding submit, instead of hard-coding navigation.
      nextStep: nextStep(snapshot),
    };
  }

  async acceptCovenant(userId: string, input: CovenantAcceptInput, req: Request) {
    if (input.version !== COVENANT_VERSION) {
      throw new BadRequestException({ code: 'covenant_version_mismatch', expected: COVENANT_VERSION });
    }
    await this.prisma.covenantSignature.upsert({
      where: { userId_version: { userId, version: input.version } },
      update: {},
      create: {
        userId,
        version: input.version,
        ipAddress: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      },
    });
    await this.advanceStep(userId, 'faith_questionnaire');
    return { ok: true };
  }

  async saveFaith(userId: string, input: FaithQuestionnaireInput) {
    await this.prisma.faithProfile.upsert({
      where: { userId },
      update: input,
      create: { userId, ...input },
    });
    await this.advanceStep(userId, 'profile_basics');
    return { ok: true };
  }

  async saveProfileBasics(userId: string, input: ProfileBasicsInput) {
    await this.prisma.profile.upsert({
      where: { userId },
      update: input,
      create: { userId, ...input },
    });
    await this.advanceStep(userId, 'first_photo');
    return { ok: true };
  }

  async saveBio(userId: string, input: BioInput) {
    const moderation = await this.textModeration.classify(input.bio);
    if (moderation.decision === 'block') {
      throw new BadRequestException({
        code: 'bio_rejected',
        categories: moderation.categories,
      });
    }
    const approved = moderation.decision === 'allow';
    await this.prisma.profile.update({
      where: { userId },
      data: { bio: input.bio, bioApproved: approved },
    });
    await this.prisma.moderationItem.create({
      data: {
        userId,
        kind: 'text_bio',
        rawContent: input.bio,
        decision: moderation.decision,
        status: approved ? 'approved' : 'pending',
        categories: moderation.categories,
        provider: moderation.provider,
        rawScore: moderation.rawScore,
      },
    });
    if (approved) await this.advanceStep(userId, 'done');
    return { ok: true, bioApproved: approved, queuedForReview: !approved };
  }

  private async advanceStep(userId: string, step: 'faith_questionnaire' | 'profile_basics' | 'first_photo' | 'bio' | 'done') {
    await this.prisma.profile.upsert({
      where: { userId },
      update: { onboardingStep: step },
      create: {
        userId,
        displayName: '',
        gender: 'female',
        city: '',
        countryCode: 'XX',
        onboardingStep: step,
      },
    });
  }
}

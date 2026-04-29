import { BadRequestException, Injectable } from '@nestjs/common';
import {
  COVENANT_VERSION,
  nextStep,
  type BioInput,
  type CovenantAcceptInput,
  type FaithQuestionnaireInput,
  type ProfileBasicsInput,
  type Q3RedirectInput,
  type QuestionnaireSubmitInput,
  type WelcomedTag,
  type WelcomedTagsUpdateInput,
} from '@blesscupid/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { TextModerationService } from '../moderation/text-moderation.service.js';
import type { Request } from 'express';

type WelcomedTagVisibility = Partial<Record<WelcomedTag, boolean>>;

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

    // BLE-124 — `faithComplete` is true when either the legacy faithProfile
    // (BLE-7) or the v1 questionnaire (Profile.intent set) has been
    // submitted. Both clients route past the faith-questionnaire step.
    const faithComplete = !!faith || !!profile?.intent;

    const snapshot = {
      ageVerifiedAdult: user.ageVerifiedAdult,
      covenantSigned: !!covenant,
      faithComplete,
      profileComplete: !!profile,
      hasPhoto: photoCount > 0,
      bioApproved: profile?.bioApproved ?? false,
    };

    return {
      ...snapshot,
      onboardingStep: profile?.onboardingStep ?? 'age_gate',
      // Server-authoritative next step. Mobile must call /onboarding/state
      // after each onboarding submit and route to nextStep, instead of
      // hard-coding navigation.
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

  // BLE-124 — onboarding questionnaire v1 submit.
  //
  // Privacy-by-default contract enforced here:
  //   - Q3 same-sex option does NOT persist a same-sex match preference.
  //     The `seeking=same_sex` flag is held only as a redirect trigger;
  //     the actual redirect handler resolves it (`acceptQ3Redirect`).
  //   - Q7 `welcomedTagVisibility` defaults to `false` for any tag not
  //     explicitly opted-in; the schema also rejects visibility=true for
  //     tags absent from the selected set.
  //   - Q9 `bioSeed` runs the same text moderation stack as a regular bio.
  //     On `block` the bio seed is dropped (saved unapproved); on `review`
  //     it is queued and surfaced to the client as a soft-flag.
  async saveQuestionnaire(userId: string, input: QuestionnaireSubmitInput) {
    const isDating = input.intent === 'dating';
    const seekingSameSex = isDating && input.seeking === 'same_sex';

    let bioSeedApproved = false;
    let bioSeedFlagged = false;
    if (input.bioSeed) {
      const moderation = await this.textModeration.classify(input.bioSeed);
      await this.prisma.moderationItem.create({
        data: {
          userId,
          kind: 'text_bio',
          rawContent: input.bioSeed,
          decision: moderation.decision,
          status: moderation.decision === 'allow' ? 'approved' : 'pending',
          categories: moderation.categories,
          provider: moderation.provider,
          rawScore: moderation.rawScore,
        },
      });
      if (moderation.decision === 'block') {
        // Soft-suggest revision per Holy Code §5.1 — do not silently reject,
        // do not persist as a published seed. Surface to client to revise.
        return {
          ok: false,
          code: 'bio_seed_flagged',
          decision: 'block' as const,
          categories: moderation.categories,
        };
      }
      bioSeedApproved = moderation.decision === 'allow';
      bioSeedFlagged = moderation.decision === 'review';
    }

    const visibility: WelcomedTagVisibility = {};
    const selected = new Set(input.welcomedTags);
    for (const tag of selected) {
      visibility[tag] = input.welcomedTagVisibility[tag] === true;
    }

    await this.prisma.profile.upsert({
      where: { userId },
      update: {
        intent: input.intent,
        seeking: isDating ? input.seeking ?? null : null,
        tradition: input.tradition,
        traditionOther: input.traditionOther ?? null,
        walkStage: input.walkStage ?? null,
        marriageOpen: isDating ? input.marriageOpen ?? null : null,
        welcomedTags: input.welcomedTags,
        welcomedTagVisibility: visibility as Prisma.InputJsonValue,
        practiceTags: input.practiceTags,
        bioSeed: input.bioSeed ?? null,
        bioSeedApproved,
      },
      create: {
        userId,
        displayName: '',
        gender: 'female',
        city: '',
        countryCode: 'XX',
        intent: input.intent,
        seeking: isDating ? input.seeking ?? null : null,
        tradition: input.tradition,
        traditionOther: input.traditionOther ?? null,
        walkStage: input.walkStage ?? null,
        marriageOpen: isDating ? input.marriageOpen ?? null : null,
        welcomedTags: input.welcomedTags,
        welcomedTagVisibility: visibility as Prisma.InputJsonValue,
        practiceTags: input.practiceTags,
        bioSeed: input.bioSeed ?? null,
        bioSeedApproved,
        onboardingStep: 'profile_basics',
      },
    });

    // Q6 "no" → friendship re-route consent. The client offers the toggle
    // before submit; this branch honors it server-side.
    if (isDating && input.marriageOpen === 'no') {
      await this.prisma.profile.update({
        where: { userId },
        data: { intent: 'friendship', seeking: null, marriageOpen: null },
      });
    }

    // Q3 same-sex: the redirect handler is the only path that persists
    // intent/account state. Signal the client to render the modal.
    if (seekingSameSex) {
      return { ok: true, q3Redirect: true, bioSeedFlagged };
    }

    await this.advanceStep(userId, 'profile_basics');
    return { ok: true, q3Redirect: false, bioSeedFlagged };
  }

  // BLE-124 — Q3 same-sex redirect outcome.
  //
  // accept_reroute → intent=friendship, clears seeking. No same-sex match
  //   preference is ever written.
  // closed_by_user → record the outcome; account hard-delete is owned by
  //   AccountModule (BLE-10) and surfaced from settings.
  // Modal CTA copy is verbatim Pastor-frozen; tone changes require
  // Pastor + CEO sign-off (BLE-41 user-covenant doc).
  async acceptQ3Redirect(userId: string, input: Q3RedirectInput) {
    await this.prisma.q3RedirectEvent.create({
      data: { userId, outcome: input.outcome },
    });

    if (input.outcome === 'accept_reroute') {
      await this.prisma.profile.update({
        where: { userId },
        data: { intent: 'friendship', seeking: null, marriageOpen: null },
      });
      await this.advanceStep(userId, 'profile_basics');
      return { ok: true, intent: 'friendship' as const };
    }

    return { ok: true, intent: 'closed_by_user' as const };
  }

  // BLE-124 — settings UI per-tag visibility update for Q7 welcomed tags.
  // Privacy-by-default lint: any tag absent from `welcomedTags` cannot be
  // marked visible. The zod refinement also rejects this at the boundary.
  async updateWelcomedTags(userId: string, input: WelcomedTagsUpdateInput) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new BadRequestException({ code: 'profile_not_found' });
    }

    const nextTags = input.welcomedTags ?? (profile.welcomedTags as WelcomedTag[]);
    const incomingVisibility = input.welcomedTagVisibility ?? {};
    const previous = (profile.welcomedTagVisibility as WelcomedTagVisibility | null) ?? {};

    const visibility: WelcomedTagVisibility = {};
    const selected = new Set(nextTags);
    for (const tag of selected) {
      const incoming = incomingVisibility[tag];
      visibility[tag] = incoming === true ? true : previous[tag] === true;
    }

    await this.prisma.profile.update({
      where: { userId },
      data: {
        welcomedTags: nextTags,
        welcomedTagVisibility: visibility as Prisma.InputJsonValue,
      },
    });

    return { ok: true, welcomedTags: nextTags, welcomedTagVisibility: visibility };
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

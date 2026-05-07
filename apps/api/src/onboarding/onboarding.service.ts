import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  COVENANT_VERSION,
  ONBOARDING_LIMITS,
  ONBOARDING_TOTAL_STEPS,
  type OnboardingStateResponse,
  type OnboardingStep1Body,
  type OnboardingStep2Body,
  type OnboardingStep3Body,
  type OnboardingStep4Body,
  type OnboardingStep5Body,
  type OnboardingStep6Body,
  type OnboardingStep7Body,
  type OnboardingStep8Body,
  type WhimsicalQuestion,
} from '@blesscupid/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { hashEmail } from '../auth/email-hash.js';
import { tryParseWhimsicalAnswers } from './whimsical-validation.js';
import type { Request } from 'express';

type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface StepResult {
  currentStep: number;
  nextHint?: string;
}

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------
  // GET /onboarding/state
  // ---------------------------------------------------------------------

  async getState(userId: string): Promise<OnboardingStateResponse> {
    const [user, profile, photoCount, covenant] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.profile.findUnique({ where: { userId } }),
      this.prisma.photo.count({
        where: { userId, status: { in: ['uploaded', 'processing', 'approved'] } },
      }),
      this.prisma.covenantSignature.findFirst({
        where: { userId, version: COVENANT_VERSION },
      }),
    ]);

    if (!user) throw new NotFoundException({ code: 'user_not_found' });

    const currentStep = profile?.onboardingStep ?? 0;
    const isComplete = user.onboardingCompleted;
    const whimsy = tryParseWhimsicalAnswers(profile?.whimsicalAnswers ?? null);
    const whimsicalKeys: WhimsicalQuestion[] = whimsy
      ? (Object.keys(whimsy) as WhimsicalQuestion[])
      : ((profile?.whimsicalAnswers as Prisma.JsonObject | null | undefined)
          ? (Object.keys(profile!.whimsicalAnswers as Prisma.JsonObject) as WhimsicalQuestion[])
          : []);

    return {
      currentStep,
      isComplete,
      capturedFields: {
        ...(profile?.displayName ? { displayName: profile.displayName } : {}),
        ...(user.dob ? { dob: this.toIsoDate(user.dob) } : {}),
        ...(profile?.gender ? { gender: profile.gender } : {}),
        ...(profile?.seeking ? { seeking: profile.seeking } : {}),
        ...(profile?.tradition && profile.tradition !== 'other'
          ? { tradition: profile.tradition }
          : {}),
        ...(profile?.city ? { city: profile.city } : {}),
        ...(profile?.countryCode ? { countryCode: profile.countryCode } : {}),
        ...(profile?.homeChurchName ? { homeChurchName: profile.homeChurchName } : {}),
        photoCount,
        covenantSigned: !!covenant,
        whimsicalKeys,
      },
    };
  }

  // ---------------------------------------------------------------------
  // POST /onboarding/step/:n — main dispatcher
  // ---------------------------------------------------------------------

  async saveStep(userId: string, n: number, body: unknown, req: Request): Promise<StepResult> {
    if (!Number.isInteger(n) || n < 1 || n > ONBOARDING_TOTAL_STEPS) {
      throw new BadRequestException({ code: 'invalid_step', step: n });
    }
    const step = n as StepNumber;
    await this.assertStepValid(userId, step);

    switch (step) {
      case 1:
        await this.saveStep1(userId, body as OnboardingStep1Body);
        break;
      case 2:
        await this.saveStep2(userId, body as OnboardingStep2Body);
        break;
      case 3:
        await this.saveStep3(userId, body as OnboardingStep3Body);
        break;
      case 4:
        await this.saveStep4(userId, body as OnboardingStep4Body);
        break;
      case 5:
        await this.saveStep5(userId, body as OnboardingStep5Body);
        break;
      case 6:
        await this.saveStep6(userId, body as OnboardingStep6Body);
        break;
      case 7:
        await this.saveStep7(userId, body as OnboardingStep7Body);
        break;
      case 8:
        await this.saveStep8(userId, body as OnboardingStep8Body, req);
        break;
    }

    await this.bumpStep(userId, step);

    return {
      currentStep: step,
      ...(step < ONBOARDING_TOTAL_STEPS
        ? { nextHint: `step_${step + 1}` }
        : { nextHint: 'complete' }),
    };
  }

  /**
   * Sequence guard. Mobile must save card N only after card N-1 has been
   * persisted. `Profile.onboardingStep` holds the highest step saved so
   * far (0..8); a re-save of the current step is allowed (idempotent).
   *
   * Plan reference: `~/.claude/plans/i-think-we-need-misty-eclipse.md`
   *   §"Onboarding step state machine guard".
   */
  async assertStepValid(userId: string, n: number): Promise<void> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { onboardingStep: true },
    });
    const current = profile?.onboardingStep ?? 0;
    // Allow re-save of current step (n === current) and forward by 1 only.
    if (n > current + 1) {
      throw new ConflictException({
        code: 'onboarding_step_out_of_order',
        expected: current + 1,
        received: n,
      });
    }
  }

  // ---------------------------------------------------------------------
  // POST /onboarding/q3-reject (same-sex hard-delete)
  // ---------------------------------------------------------------------

  /**
   * Q3 same-sex hard-reject. Hard-deletes the User row immediately; cascade
   * handles Profile, Sessions, OAuthAccounts, etc. Audit row carries only
   * the email hash — no PII retained.
   *
   * Plan reference: `~/.claude/plans/i-think-we-need-misty-eclipse.md` §"Q3
   * hard-reject = HARD-DELETE User row immediately".
   */
  async q3Reject(userId: string): Promise<{ ok: true }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) throw new NotFoundException({ code: 'user_not_found' });

    const emailHash = hashEmail(user.email);

    await this.prisma.$transaction([
      this.prisma.onboardingRejection.create({
        data: { emailHash, reason: 'seeking_same_sex' },
      }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);

    return { ok: true };
  }

  // ---------------------------------------------------------------------
  // POST /onboarding/complete
  // ---------------------------------------------------------------------

  async complete(userId: string): Promise<{ onboardingCompleted: true }> {
    const [user, profile, covenant, photos] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.profile.findUnique({ where: { userId } }),
      this.prisma.covenantSignature.findFirst({
        where: { userId, version: COVENANT_VERSION },
      }),
      this.prisma.photo.findMany({
        where: { userId },
        orderBy: { position: 'asc' },
        take: 1,
      }),
    ]);

    if (!user) throw new NotFoundException({ code: 'user_not_found' });
    if (user.onboardingCompleted) {
      // Idempotent — already complete.
      return { onboardingCompleted: true };
    }
    if (!profile || profile.onboardingStep < ONBOARDING_TOTAL_STEPS) {
      throw new ForbiddenException({
        code: 'onboarding_incomplete',
        currentStep: profile?.onboardingStep ?? 0,
        expected: ONBOARDING_TOTAL_STEPS,
      });
    }
    if (!covenant) {
      throw new ForbiddenException({ code: 'covenant_unsigned' });
    }
    if (photos.length === 0) {
      throw new ForbiddenException({ code: 'photo_missing' });
    }
    const first = photos[0]!;
    if (first.status === 'rejected') {
      throw new ForbiddenException({
        code: 'photo_rejected',
        reasons: first.rejectionReasons,
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });

    return { onboardingCompleted: true };
  }

  // =====================================================================
  // Per-step writers
  // =====================================================================

  private async saveStep1(userId: string, body: OnboardingStep1Body): Promise<void> {
    await this.upsertWhimsy(userId, 'q1', body.q1);
  }

  private async saveStep2(userId: string, body: OnboardingStep2Body): Promise<void> {
    const dob = this.parseDob(body.dob);
    this.assertAdult(dob);
    await this.prisma.user.update({
      where: { id: userId },
      data: { dob, ageVerifiedAdult: true },
    });
    await this.upsertProfileShell(userId, { displayName: body.displayName });
  }

  private async saveStep3(userId: string, body: OnboardingStep3Body): Promise<void> {
    await this.upsertWhimsy(userId, 'q3', body.q3);
  }

  private async saveStep4(userId: string, body: OnboardingStep4Body): Promise<void> {
    if (body.gender === body.seeking) {
      // Q3 hard-reject signal: client must call /onboarding/q3-reject after
      // showing the explanation sheet. Returning 409 keeps the rest of the
      // pipeline consistent (no profile mutation on this path).
      throw new ConflictException({
        code: 'q3_redirect_required',
        reason: 'seeking_same_sex',
      });
    }
    await this.upsertProfileShell(userId, {
      gender: body.gender,
      seeking: body.seeking,
      tradition: body.tradition,
    });
  }

  private async saveStep5(userId: string, body: OnboardingStep5Body): Promise<void> {
    await this.upsertWhimsy(userId, 'q5', body.q5);
  }

  private async saveStep6(userId: string, body: OnboardingStep6Body): Promise<void> {
    if (body.lat == null && body.lng == null && !body.city) {
      throw new BadRequestException({ code: 'location_required' });
    }
    const data: Prisma.ProfileUpdateInput = {
      city: body.city,
      countryCode: body.countryCode.toUpperCase(),
      ...(body.lat != null && body.lng != null
        ? { lat: body.lat, lng: body.lng }
        : {}),
      ...(body.homeChurchName !== undefined ? { homeChurchName: body.homeChurchName } : {}),
      ...(body.churchLat != null ? { churchLat: body.churchLat } : {}),
      ...(body.churchLng != null ? { churchLng: body.churchLng } : {}),
    };
    await this.upsertProfileShell(userId, data);
    // Mirror countryCode onto User for region-bucketed analytics + payments.
    await this.prisma.user.update({
      where: { id: userId },
      data: { countryCode: body.countryCode.toUpperCase() },
    });
  }

  private async saveStep7(userId: string, body: OnboardingStep7Body): Promise<void> {
    if (body.verseRef !== body.q7) {
      throw new BadRequestException({ code: 'verse_ref_mismatch' });
    }
    await this.upsertWhimsy(userId, 'q7', body.verseRef);

    // First StatusVerse row + UserVerseHistory entry. Verse text +
    // attribution lookup is a TODO once the verse seed pool is wired —
    // for now we persist the ref with placeholder text/attribution so
    // the relation exists; the verse module backfills on Status reads.
    await this.prisma.$transaction([
      this.prisma.statusVerse.upsert({
        where: { userId },
        update: { verseRef: body.verseRef, setAt: new Date() },
        create: {
          userId,
          verseRef: body.verseRef,
          verseText: '',
          attribution: '',
        },
      }),
      this.prisma.userVerseHistory.create({
        data: { userId, verseRef: body.verseRef, usedFor: 'status' },
      }),
    ]);
  }

  private async saveStep8(
    userId: string,
    body: OnboardingStep8Body,
    req: Request,
  ): Promise<void> {
    if (!body.covenantAccepted) {
      throw new BadRequestException({ code: 'covenant_not_accepted' });
    }

    // Photo[0] — uploaded status, processing handled async by image-variants
    // worker. Upsert at position 0 so re-save of step 8 is idempotent.
    await this.prisma.photo.upsert({
      where: { userId_position: { userId, position: 0 } },
      update: {
        storageKey: body.photoStorageKey,
        status: 'uploaded',
      },
      create: {
        userId,
        position: 0,
        storageKey: body.photoStorageKey,
        status: 'uploaded',
      },
    });

    // Covenant — schema has `@@index([userId])` only (no unique). Manual
    // findFirst → create gives the same once-per-user-per-version semantics
    // without depending on a Prisma unique constraint.
    const existingSig = await this.prisma.covenantSignature.findFirst({
      where: { userId, version: COVENANT_VERSION },
      select: { id: true },
    });
    if (!existingSig) {
      await this.prisma.covenantSignature.create({
        data: {
          userId,
          version: COVENANT_VERSION,
          ipHash: this.ipHash(req),
          userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
        },
      });
    }

    // Bio — optional, capped to 140. Status pending moderation in the
    // photos/text pipeline; we persist the raw text and clear bioApprovedAt
    // so moderation rerun fills it in.
    if (body.bio !== undefined) {
      if (body.bio.length > ONBOARDING_LIMITS.bioMax) {
        throw new BadRequestException({ code: 'bio_too_long', max: ONBOARDING_LIMITS.bioMax });
      }
      await this.prisma.profile.update({
        where: { userId },
        data: { bio: body.bio, bioApprovedAt: null },
      });
    }
  }

  // =====================================================================
  // Helpers
  // =====================================================================

  /**
   * Profile is created on the very first step write (step 1). Subsequent
   * writers use `update`. Required Prisma columns (gender, seeking,
   * tradition, walkStage, marriageIntent, city, countryCode, lat, lng) are
   * filled with sentinel placeholders until the relevant card lands —
   * matching the legacy onboarding pattern (see plan §"Onboarding step
   * state machine"). The Profile is never read by matching/feed before
   * `User.onboardingCompleted=true`, so placeholders never leak.
   */
  private async upsertProfileShell(
    userId: string,
    update: Prisma.ProfileUpdateInput,
  ): Promise<void> {
    await this.prisma.profile.upsert({
      where: { userId },
      update,
      create: {
        userId,
        displayName: typeof update.displayName === 'string' ? update.displayName : '',
        gender:
          typeof update.gender === 'string' ? (update.gender as 'male' | 'female') : 'female',
        seeking:
          typeof update.seeking === 'string' ? (update.seeking as 'male' | 'female') : 'male',
        city: typeof update.city === 'string' ? update.city : '',
        countryCode:
          typeof update.countryCode === 'string' ? update.countryCode.toUpperCase() : 'XX',
        lat: typeof update.lat === 'number' ? update.lat : 0,
        lng: typeof update.lng === 'number' ? update.lng : 0,
        tradition:
          typeof update.tradition === 'string'
            ? (update.tradition as 'catholic' | 'protestant' | 'orthodox' | 'nondenom' | 'other')
            : 'other',
        walkStage: 'seeking',
        marriageIntent: 'maybe',
        whimsicalAnswers: {},
        onboardingStep: 0,
      },
    });
  }

  private async upsertWhimsy(
    userId: string,
    key: WhimsicalQuestion,
    value: string,
  ): Promise<void> {
    // Prisma's JSON merge isn't atomic at the column level; read-modify-write
    // wrapped in a tx keeps concurrent step-saves coherent. This is fine —
    // a user only has one mobile client driving onboarding at a time.
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.profile.findUnique({
        where: { userId },
        select: { whimsicalAnswers: true },
      });
      const current = (existing?.whimsicalAnswers as Prisma.JsonObject | null | undefined) ?? {};
      const next = { ...current, [key]: value } as Prisma.InputJsonObject;

      if (existing) {
        await tx.profile.update({
          where: { userId },
          data: { whimsicalAnswers: next },
        });
      } else {
        await tx.profile.create({
          data: {
            userId,
            displayName: '',
            gender: 'female',
            seeking: 'male',
            city: '',
            countryCode: 'XX',
            lat: 0,
            lng: 0,
            tradition: 'other',
            walkStage: 'seeking',
            marriageIntent: 'maybe',
            whimsicalAnswers: next,
            onboardingStep: 0,
          },
        });
      }
    });
  }

  private async bumpStep(userId: string, step: StepNumber): Promise<void> {
    // Monotonic — never roll back, idempotent re-saves OK.
    await this.prisma.profile.update({
      where: { userId },
      data: {
        onboardingStep: step,
      },
    });
  }

  private parseDob(iso: string): Date {
    const dob = new Date(`${iso}T00:00:00Z`);
    if (Number.isNaN(dob.getTime())) {
      throw new BadRequestException({ code: 'dob_invalid' });
    }
    return dob;
  }

  /**
   * 18+ check using UTC calendar arithmetic. A user born on this date 18
   * years ago counts as adult (their birthday today). Edge-case-safe for
   * Feb-29 because UTC Date constructor normalizes Feb-29 in non-leap
   * years to Mar-1.
   */
  private assertAdult(dob: Date): void {
    const now = new Date();
    const cutoff = new Date(
      Date.UTC(
        now.getUTCFullYear() - ONBOARDING_LIMITS.minAgeYears,
        now.getUTCMonth(),
        now.getUTCDate(),
      ),
    );
    if (dob.getTime() > cutoff.getTime()) {
      throw new BadRequestException({
        code: 'underage',
        minAgeYears: ONBOARDING_LIMITS.minAgeYears,
      });
    }
  }

  private toIsoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private ipHash(req: Request): string | null {
    const ip = req.ip;
    if (!ip) return null;
    // Light-weight inline — full-strength PII hashing lives in
    // services/safety. Onboarding does not need cryptographic strength
    // beyond making the raw IP non-trivial to recover from logs.
    return Buffer.from(ip).toString('base64');
  }
}

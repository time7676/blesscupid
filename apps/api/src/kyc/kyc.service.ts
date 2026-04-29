import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { SubmitKycInput, ReviewKycInput } from '@blesscupid/shared';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class KycService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(userId: string, input: SubmitKycInput) {
    // NIK format validation: 16 digits
    const nik = input.nik;
    if (!/^\d{16}$/.test(nik)) {
      throw new BadRequestException({ code: 'invalid_nik' });
    }

    const existing = await this.prisma.kycSubmission.findUnique({ where: { userId } });
    if (existing) {
      throw new BadRequestException({ code: 'kyc_already_submitted' });
    }

    const kyc = await this.prisma.kycSubmission.create({
      data: {
        userId,
        nik,
        fullName: input.fullName,
        dob: new Date(input.dob),
        ktpImageUrl: input.ktpImageUrl,
        selfieImageUrl: input.selfieImageUrl,
        status: 'pending',
      },
    });

    // Update user kycStatus
    await this.prisma.user.update({
      where: { id: userId },
      data: { kycStatus: 'pending' },
    });

    return { id: kyc.id, status: kyc.status };
  }

  async getStatus(userId: string) {
    const kyc = await this.prisma.kycSubmission.findUnique({ where: { userId } });
    return {
      kycStatus: kyc?.status ?? 'none',
      submittedAt: kyc?.submittedAt ?? null,
      reviewedAt: kyc?.reviewedAt ?? null,
      rejectionReason: kyc?.rejectionReason ?? null,
    };
  }

  async getPendingQueue() {
    return this.prisma.kycSubmission.findMany({
      where: { status: 'pending' },
      orderBy: { submittedAt: 'asc' },
      select: {
        id: true,
        userId: true,
        nik: true,
        fullName: true,
        dob: true,
        ktpImageUrl: true,
        selfieImageUrl: true,
        faceMatchScore: true,
        submittedAt: true,
      },
    });
  }

  async review(reviewerId: string, id: string, input: ReviewKycInput) {
    const kyc = await this.prisma.kycSubmission.findUnique({ where: { id } });
    if (!kyc) throw new NotFoundException({ code: 'kyc_not_found' });
    if (kyc.status !== 'pending') {
      throw new BadRequestException({ code: 'kyc_already_reviewed' });
    }

    const updated = await this.prisma.kycSubmission.update({
      where: { id },
      data: {
        status: input.status,
        reviewerId,
        reviewedAt: new Date(),
        rejectionReason: input.status === 'rejected' ? input.rejectionReason : null,
      },
    });

    await this.prisma.user.update({
      where: { id: kyc.userId },
      data: { kycStatus: input.status },
    });

    return { id: updated.id, status: updated.status };
  }
}

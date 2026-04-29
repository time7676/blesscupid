import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert } from 'firebase-admin/app';
import type { VerifyPhoneInput } from '@blesscupid/shared';
import { PrismaService } from '../prisma/prisma.service.js';

let firebaseInitialized = false;
function ensureFirebase() {
  if (firebaseInitialized) return;
  const credJson = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;
  if (!credJson) {
    throw new Error('FIREBASE_ADMIN_CREDENTIALS_JSON unset');
  }
  initializeApp({
    credential: cert(JSON.parse(credJson) as never),
  });
  firebaseInitialized = true;
}

@Injectable()
export class PhoneAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async verifyPhone(userId: string, input: VerifyPhoneInput) {
    ensureFirebase();

    let decoded;
    try {
      decoded = await getAuth().verifyIdToken(input.idToken);
    } catch {
      throw new UnauthorizedException({ code: 'invalid_phone_token' });
    }

    const phoneNumber = decoded.phone_number;
    if (!phoneNumber) {
      throw new BadRequestException({ code: 'token_missing_phone' });
    }
    if (phoneNumber !== input.phoneNumber) {
      throw new BadRequestException({ code: 'phone_mismatch' });
    }

    const existing = await this.prisma.user.findUnique({ where: { phoneNumber } });
    if (existing && existing.id !== userId) {
      throw new BadRequestException({ code: 'phone_taken' });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { phoneNumber, phoneVerifiedAt: new Date() },
    });

    return { phoneNumber, verified: true };
  }
}

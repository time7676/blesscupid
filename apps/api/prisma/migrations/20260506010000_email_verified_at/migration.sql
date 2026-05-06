-- Adds User.emailVerifiedAt distinct from consentedAt
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

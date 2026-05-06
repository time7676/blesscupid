-- CreateEnum
CREATE TYPE "Role" AS ENUM ('member', 'admin');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('en', 'id');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "Tradition" AS ENUM ('catholic', 'protestant', 'orthodox', 'nondenom', 'other');

-- CreateEnum
CREATE TYPE "WalkStage" AS ENUM ('seeking', 'growing', 'rooted');

-- CreateEnum
CREATE TYPE "MarriageIntent" AS ENUM ('yes', 'maybe', 'no');

-- CreateEnum
CREATE TYPE "ProximityHint" AS ENUM ('near', 'same_city', 'different_city');

-- CreateEnum
CREATE TYPE "PhotoStatus" AS ENUM ('uploaded', 'processing', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "MessageKind" AS ENUM ('text', 'verse_share');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('delivered', 'queued', 'blocked');

-- CreateEnum
CREATE TYPE "DecisionKind" AS ENUM ('pass', 'like', 'super_like');

-- CreateEnum
CREATE TYPE "VerseUsedFor" AS ENUM ('chat_anchor', 'status');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('match', 'message', 'like', 'verification', 'status', 'other');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('free', 'blessplus');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'trialing', 'cancelled', 'expired', 'payment_failed', 'grace_period');

-- CreateEnum
CREATE TYPE "SubscriptionCycle" AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('sexual_content', 'harassment', 'fake_profile', 'underage', 'hate_or_harassment', 'self_harm_or_crisis', 'spam', 'other');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('open', 'under_review', 'resolved');

-- CreateEnum
CREATE TYPE "ModerationDecision" AS ENUM ('allow', 'review', 'block');

-- CreateEnum
CREATE TYPE "ModerationKind" AS ENUM ('text_bio', 'text_message', 'photo', 'status_verse');

-- CreateEnum
CREATE TYPE "OnboardingRejectionReason" AS ENUM ('seeking_same_sex', 'age_under_18', 'banned_user');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "PastorApprovalKind" AS ENUM ('verse_seed', 'banned_phrases', 'covenant');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('apple', 'google');

-- CreateEnum
CREATE TYPE "PasswordResetStatus" AS ENUM ('pending', 'used', 'expired');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "passwordHash" TEXT,
    "dob" DATE NOT NULL,
    "ageVerifiedAdult" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" NOT NULL DEFAULT 'member',
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "localePreference" "Locale" NOT NULL DEFAULT 'en',
    "countryCode" CHAR(2),
    "consentedAt" TIMESTAMP(3),
    "consentVersion" TEXT,
    "consentLocale" "Locale",
    "consentIpHash" TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerSub" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "otpHash" TEXT NOT NULL,
    "status" "PasswordResetStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CovenantSignature" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "version" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "CovenantSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "userId" UUID NOT NULL,
    "displayName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "seeking" "Gender" NOT NULL,
    "city" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "homeChurchName" TEXT,
    "churchLat" DOUBLE PRECISION,
    "churchLng" DOUBLE PRECISION,
    "bio" TEXT,
    "bioApprovedAt" TIMESTAMP(3),
    "tradition" "Tradition" NOT NULL,
    "walkStage" "WalkStage" NOT NULL,
    "marriageIntent" "MarriageIntent" NOT NULL,
    "whimsicalAnswers" JSONB NOT NULL DEFAULT '{}',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "pausedUntil" TIMESTAMP(3),
    "hideFromUnverified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "status" "PhotoStatus" NOT NULL DEFAULT 'uploaded',
    "faceCount" INTEGER,
    "faceAreaRatio" DOUBLE PRECISION,
    "rejectionReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unsafeLabels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "exifStripped" BOOLEAN NOT NULL DEFAULT false,
    "variantsGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationSubmission" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "selfieKey" TEXT NOT NULL,
    "faceMatchScore" DOUBLE PRECISION,
    "status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "decidedAt" TIMESTAMP(3),
    "decidedByUserId" UUID,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchDecision" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "candidateUserId" UUID NOT NULL,
    "decision" "DecisionKind" NOT NULL,
    "day" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" UUID NOT NULL,
    "userAId" UUID NOT NULL,
    "userBId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyQuota" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "day" TEXT NOT NULL,
    "likesUsed" INTEGER NOT NULL DEFAULT 0,
    "supersUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Thread" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadAnchor" (
    "threadId" UUID NOT NULL,
    "verseRef" TEXT NOT NULL,
    "verseText" TEXT NOT NULL,
    "attribution" TEXT NOT NULL,

    CONSTRAINT "ThreadAnchor_pkey" PRIMARY KEY ("threadId")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "senderUserId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "kind" "MessageKind" NOT NULL DEFAULT 'text',
    "verseRef" TEXT,
    "clientMessageId" UUID NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'delivered',
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerseCache" (
    "id" UUID NOT NULL,
    "ref" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "attribution" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerseCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVerseHistory" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "verseRef" TEXT NOT NULL,
    "usedFor" "VerseUsedFor" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserVerseHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusVerse" (
    "userId" UUID NOT NULL,
    "verseRef" TEXT NOT NULL,
    "verseText" TEXT NOT NULL,
    "attribution" TEXT NOT NULL,
    "setAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "StatusVerse_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ModerationQueueItem" (
    "id" UUID NOT NULL,
    "kind" "ModerationKind" NOT NULL,
    "decision" "ModerationDecision" NOT NULL,
    "reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rawScores" JSONB,
    "senderUserId" UUID,
    "bodyText" TEXT,
    "refId" UUID,
    "reviewerUserId" UUID,
    "reviewedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "reporterUserId" UUID,
    "reporterDeleted" BOOLEAN NOT NULL DEFAULT false,
    "reportedUserId" UUID NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "detail" TEXT,
    "threadId" UUID,
    "messageId" UUID,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "reviewerUserId" UUID,
    "reviewedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "blockerUserId" UUID NOT NULL,
    "blockedUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("blockerUserId","blockedUserId")
);

-- CreateTable
CREATE TABLE "PushToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "appVersion" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" UUID NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "cycle" "SubscriptionCycle" NOT NULL,
    "priceIdr" INTEGER NOT NULL,
    "xenditPlanId" TEXT,
    "features" JSONB NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscription" (
    "userId" UUID NOT NULL,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'free',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "cycle" "SubscriptionCycle",
    "startedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "xenditRecurringId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "amountIdr" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "method" TEXT,
    "xenditInvoiceId" TEXT,
    "xenditChargeId" TEXT,
    "xenditRecurringId" TEXT,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingRejection" (
    "id" UUID NOT NULL,
    "emailHash" TEXT NOT NULL,
    "reason" "OnboardingRejectionReason" NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingRejection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PastorApproval" (
    "id" UUID NOT NULL,
    "kind" "PastorApprovalKind" NOT NULL,
    "version" TEXT NOT NULL,
    "approvedBy" UUID NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "PastorApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Waitlist" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "intent" TEXT,
    "city" TEXT,
    "locale" CHAR(2),
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'signed_up',
    "utmCampaign" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "User_countryCode_idx" ON "User"("countryCode");

-- CreateIndex
CREATE INDEX "User_lastActiveAt_idx" ON "User"("lastActiveAt");

-- CreateIndex
CREATE INDEX "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerSub_key" ON "OAuthAccount"("provider", "providerSub");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshTokenHash_key" ON "Session"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_status_idx" ON "PasswordReset"("userId", "status");

-- CreateIndex
CREATE INDEX "PasswordReset_expiresAt_idx" ON "PasswordReset"("expiresAt");

-- CreateIndex
CREATE INDEX "CovenantSignature_userId_idx" ON "CovenantSignature"("userId");

-- CreateIndex
CREATE INDEX "Profile_city_idx" ON "Profile"("city");

-- CreateIndex
CREATE INDEX "Profile_countryCode_gender_seeking_idx" ON "Profile"("countryCode", "gender", "seeking");

-- CreateIndex
CREATE INDEX "Profile_isVerified_idx" ON "Profile"("isVerified");

-- CreateIndex
CREATE INDEX "Photo_userId_idx" ON "Photo"("userId");

-- CreateIndex
CREATE INDEX "Photo_status_idx" ON "Photo"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_userId_position_key" ON "Photo"("userId", "position");

-- CreateIndex
CREATE INDEX "VerificationSubmission_userId_createdAt_idx" ON "VerificationSubmission"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "VerificationSubmission_status_idx" ON "VerificationSubmission"("status");

-- CreateIndex
CREATE INDEX "MatchDecision_userId_createdAt_idx" ON "MatchDecision"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MatchDecision_candidateUserId_decision_idx" ON "MatchDecision"("candidateUserId", "decision");

-- CreateIndex
CREATE INDEX "MatchDecision_userId_day_idx" ON "MatchDecision"("userId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "MatchDecision_userId_candidateUserId_key" ON "MatchDecision"("userId", "candidateUserId");

-- CreateIndex
CREATE INDEX "Match_userAId_createdAt_idx" ON "Match"("userAId", "createdAt");

-- CreateIndex
CREATE INDEX "Match_userBId_createdAt_idx" ON "Match"("userBId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Match_userAId_userBId_key" ON "Match"("userAId", "userBId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyQuota_userId_day_key" ON "DailyQuota"("userId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "Thread_matchId_key" ON "Thread"("matchId");

-- CreateIndex
CREATE INDEX "Thread_lastMessageAt_idx" ON "Thread"("lastMessageAt");

-- CreateIndex
CREATE INDEX "Message_threadId_createdAt_idx" ON "Message"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderUserId_idx" ON "Message"("senderUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_threadId_clientMessageId_key" ON "Message"("threadId", "clientMessageId");

-- CreateIndex
CREATE INDEX "VerseCache_expiresAt_idx" ON "VerseCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerseCache_ref_translation_key" ON "VerseCache"("ref", "translation");

-- CreateIndex
CREATE INDEX "UserVerseHistory_userId_usedFor_createdAt_idx" ON "UserVerseHistory"("userId", "usedFor", "createdAt");

-- CreateIndex
CREATE INDEX "UserVerseHistory_verseRef_idx" ON "UserVerseHistory"("verseRef");

-- CreateIndex
CREATE INDEX "StatusVerse_setAt_idx" ON "StatusVerse"("setAt");

-- CreateIndex
CREATE INDEX "ModerationQueueItem_decision_reviewedAt_idx" ON "ModerationQueueItem"("decision", "reviewedAt");

-- CreateIndex
CREATE INDEX "ModerationQueueItem_senderUserId_idx" ON "ModerationQueueItem"("senderUserId");

-- CreateIndex
CREATE INDEX "ModerationQueueItem_createdAt_idx" ON "ModerationQueueItem"("createdAt");

-- CreateIndex
CREATE INDEX "Report_reportedUserId_idx" ON "Report"("reportedUserId");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Block_blockedUserId_idx" ON "Block"("blockedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PushToken_token_key" ON "PushToken"("token");

-- CreateIndex
CREATE INDEX "PushToken_userId_idx" ON "PushToken"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_tier_cycle_key" ON "SubscriptionPlan"("tier", "cycle");

-- CreateIndex
CREATE INDEX "UserSubscription_status_expiresAt_idx" ON "UserSubscription"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "UserSubscription_trialEndsAt_idx" ON "UserSubscription"("trialEndsAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_xenditInvoiceId_key" ON "PaymentTransaction"("xenditInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_xenditChargeId_key" ON "PaymentTransaction"("xenditChargeId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_userId_createdAt_idx" ON "PaymentTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX "OnboardingRejection_emailHash_idx" ON "OnboardingRejection"("emailHash");

-- CreateIndex
CREATE INDEX "OnboardingRejection_reason_closedAt_idx" ON "OnboardingRejection"("reason", "closedAt");

-- CreateIndex
CREATE INDEX "PastorApproval_approvedAt_idx" ON "PastorApproval"("approvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PastorApproval_kind_version_key" ON "PastorApproval"("kind", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_email_key" ON "Waitlist"("email");

-- CreateIndex
CREATE INDEX "Waitlist_status_idx" ON "Waitlist"("status");

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CovenantSignature" ADD CONSTRAINT "CovenantSignature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationSubmission" ADD CONSTRAINT "VerificationSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchDecision" ADD CONSTRAINT "MatchDecision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchDecision" ADD CONSTRAINT "MatchDecision_candidateUserId_fkey" FOREIGN KEY ("candidateUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyQuota" ADD CONSTRAINT "DailyQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadAnchor" ADD CONSTRAINT "ThreadAnchor_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVerseHistory" ADD CONSTRAINT "UserVerseHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusVerse" ADD CONSTRAINT "StatusVerse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerUserId_fkey" FOREIGN KEY ("blockerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushToken" ADD CONSTRAINT "PushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- v1 hardening: DEFERRABLE constraint on Photo(userId, position)
-- Allows reorder swaps within single transaction. Replaces Prisma-generated
-- IMMEDIATE unique index with a constraint flag-flippable to DEFERRED inside a tx.
DROP INDEX IF EXISTS "Photo_userId_position_key";
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_userId_position_key"
  UNIQUE ("userId", "position") DEFERRABLE INITIALLY IMMEDIATE;

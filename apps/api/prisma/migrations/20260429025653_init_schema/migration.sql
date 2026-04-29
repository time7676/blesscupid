-- CreateEnum
CREATE TYPE "Denomination" AS ENUM ('catholic', 'protestant', 'orthodox', 'other');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "MarriageIntent" AS ENUM ('within_1y', 'within_2y', 'within_5y', 'open_timeline');

-- CreateEnum
CREATE TYPE "ChurchAttendance" AS ENUM ('weekly', 'monthly', 'occasional', 'rarely');

-- CreateEnum
CREATE TYPE "SpiritualGift" AS ENUM ('teaching', 'service', 'mercy', 'exhortation', 'giving', 'leadership', 'evangelism', 'hospitality');

-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('apple', 'google');

-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('age_gate', 'covenant', 'faith_questionnaire', 'profile_basics', 'first_photo', 'bio', 'done');

-- CreateEnum
CREATE TYPE "ModerationKind" AS ENUM ('text_bio', 'text_message', 'photo');

-- CreateEnum
CREATE TYPE "ModerationDecision" AS ENUM ('allow', 'review', 'block');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "PhotoStatus" AS ENUM ('uploaded', 'processing', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('member', 'pastor', 'ceo');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('delivered', 'queued', 'blocked');

-- CreateEnum
CREATE TYPE "ModerationQueueKind" AS ENUM ('text', 'image');

-- CreateEnum
CREATE TYPE "ModerationQueueStatus" AS ENUM ('pending_review', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('sexual_content', 'harassment', 'off_platform_pressure', 'scam_or_spam', 'underage', 'fake_profile', 'other');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('open', 'under_review', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "ModerationActionKind" AS ENUM ('dismiss', 'warn', 'suspend', 'ban');

-- CreateEnum
CREATE TYPE "AccountDeletionStatus" AS ENUM ('soft_deleted', 'hard_deleted', 'cancelled');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "dob" DATE NOT NULL,
    "ageVerifiedAdult" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'member',
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    "providerSub" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CovenantSignature" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "CovenantSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaithProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "denomination" "Denomination" NOT NULL,
    "churchAttendance" "ChurchAttendance" NOT NULL,
    "baptized" BOOLEAN NOT NULL,
    "marriageIntent" "MarriageIntent" NOT NULL,
    "spiritualGifts" "SpiritualGift"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaithProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "displayName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "city" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "bio" TEXT,
    "bioApproved" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" "OnboardingStep" NOT NULL DEFAULT 'age_gate',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "PhotoStatus" NOT NULL DEFAULT 'uploaded',
    "faceCount" INTEGER,
    "faceAreaRatio" DOUBLE PRECISION,
    "rejectionReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unsafeLabels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationItem" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "kind" "ModerationKind" NOT NULL,
    "subjectId" TEXT,
    "rawContent" TEXT,
    "decision" "ModerationDecision" NOT NULL,
    "status" "ModerationStatus" NOT NULL DEFAULT 'pending',
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "provider" TEXT NOT NULL,
    "rawScore" DOUBLE PRECISION,
    "reviewerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModerationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "senderUserId" UUID NOT NULL,
    "recipientUserId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "attachmentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "MessageStatus" NOT NULL,
    "queueItemId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationQueueItem" (
    "id" UUID NOT NULL,
    "kind" "ModerationQueueKind" NOT NULL,
    "status" "ModerationQueueStatus" NOT NULL DEFAULT 'pending_review',
    "senderUserId" UUID,
    "recipientUserId" UUID,
    "threadId" UUID,
    "uploadId" UUID,
    "storageKey" TEXT,
    "bodyText" TEXT,
    "attachmentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "decision" TEXT NOT NULL,
    "reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rawScores" JSONB NOT NULL,
    "reviewerNote" TEXT,
    "reviewerUserId" UUID,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "reporterUserId" UUID NOT NULL,
    "reportedUserId" UUID NOT NULL,
    "threadId" UUID,
    "messageId" UUID,
    "reason" "ReportReason" NOT NULL,
    "freeform" TEXT,
    "severity" INTEGER NOT NULL DEFAULT 0,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" UUID,
    "moderationActionId" UUID,
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
CREATE TABLE "EvidenceFreeze" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceFreeze_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "actorUserId" UUID NOT NULL,
    "kind" "ModerationActionKind" NOT NULL,
    "notes" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountDeletionRequest" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "AccountDeletionStatus" NOT NULL DEFAULT 'soft_deleted',
    "expedited" BOOLEAN NOT NULL DEFAULT false,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "softDeletedAt" TIMESTAMP(3),
    "hardDeleteScheduledAt" TIMESTAMP(3) NOT NULL,
    "hardDeletedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "AccountDeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerseCache" (
    "ref" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "attribution" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerseCache_pkey" PRIMARY KEY ("ref","translation")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerSub_key" ON "OAuthAccount"("provider", "providerSub");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshTokenHash_key" ON "Session"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "CovenantSignature_userId_idx" ON "CovenantSignature"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CovenantSignature_userId_version_key" ON "CovenantSignature"("userId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "FaithProfile_userId_key" ON "FaithProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Profile_countryCode_city_idx" ON "Profile"("countryCode", "city");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_storageKey_key" ON "Photo"("storageKey");

-- CreateIndex
CREATE INDEX "Photo_userId_position_idx" ON "Photo"("userId", "position");

-- CreateIndex
CREATE INDEX "ModerationItem_status_createdAt_idx" ON "ModerationItem"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationItem_userId_idx" ON "ModerationItem"("userId");

-- CreateIndex
CREATE INDEX "Message_threadId_createdAt_idx" ON "Message"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_recipientUserId_status_idx" ON "Message"("recipientUserId", "status");

-- CreateIndex
CREATE INDEX "ModerationQueueItem_status_createdAt_idx" ON "ModerationQueueItem"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationQueueItem_senderUserId_idx" ON "ModerationQueueItem"("senderUserId");

-- CreateIndex
CREATE INDEX "Report_reportedUserId_createdAt_idx" ON "Report"("reportedUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Report_reporterUserId_idx" ON "Report"("reporterUserId");

-- CreateIndex
CREATE INDEX "Report_status_severity_createdAt_idx" ON "Report"("status", "severity", "createdAt");

-- CreateIndex
CREATE INDEX "Block_blockedUserId_idx" ON "Block"("blockedUserId");

-- CreateIndex
CREATE INDEX "EvidenceFreeze_threadId_expiresAt_idx" ON "EvidenceFreeze"("threadId", "expiresAt");

-- CreateIndex
CREATE INDEX "EvidenceFreeze_expiresAt_idx" ON "EvidenceFreeze"("expiresAt");

-- CreateIndex
CREATE INDEX "ModerationAction_reportId_idx" ON "ModerationAction"("reportId");

-- CreateIndex
CREATE INDEX "ModerationAction_actorUserId_appliedAt_idx" ON "ModerationAction"("actorUserId", "appliedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AccountDeletionRequest_userId_key" ON "AccountDeletionRequest"("userId");

-- CreateIndex
CREATE INDEX "AccountDeletionRequest_status_hardDeleteScheduledAt_idx" ON "AccountDeletionRequest"("status", "hardDeleteScheduledAt");

-- CreateIndex
CREATE INDEX "VerseCache_expiresAt_idx" ON "VerseCache"("expiresAt");

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CovenantSignature" ADD CONSTRAINT "CovenantSignature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaithProfile" ADD CONSTRAINT "FaithProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationItem" ADD CONSTRAINT "ModerationItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_queueItemId_fkey" FOREIGN KEY ("queueItemId") REFERENCES "ModerationQueueItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationQueueItem" ADD CONSTRAINT "ModerationQueueItem_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerUserId_fkey" FOREIGN KEY ("blockerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceFreeze" ADD CONSTRAINT "EvidenceFreeze_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountDeletionRequest" ADD CONSTRAINT "AccountDeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

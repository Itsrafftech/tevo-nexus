-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "nexus";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tevo";

-- CreateEnum
CREATE TYPE "core"."MediaOwnerType" AS ENUM ('MEMBER_PHOTO', 'PROGRAM_COVER', 'NEWS_IMAGE', 'CMS_MEDIA');

-- CreateEnum
CREATE TYPE "nexus"."UserRole" AS ENUM ('SUPER_ADMIN', 'BPH', 'TEVO_ADMIN', 'KETUA_BIRDEP', 'SEKRETARIS_BIRDEP', 'BENDAHARA_BIRDEP', 'ANGGOTA_BIRDEP');

-- CreateEnum
CREATE TYPE "nexus"."PermissionOverrideEffect" AS ENUM ('GRANT', 'REVOKE');

-- CreateEnum
CREATE TYPE "nexus"."ProgramStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "nexus"."PressReleaseSourceType" AS ENUM ('GOOGLE_DOCS', 'URL', 'INTERNAL_ARTICLE');

-- CreateEnum
CREATE TYPE "tevo"."PublishStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "core"."Birdep" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "core"."Member" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "photoAssetId" TEXT,
ADD COLUMN     "publicBio" TEXT;

-- AlterTable
ALTER TABLE "core"."Membership" ADD COLUMN     "publicTitle" TEXT;

-- CreateTable
CREATE TABLE "core"."MediaAsset" (
    "id" TEXT NOT NULL,
    "ownerType" "core"."MediaOwnerType" NOT NULL,
    "ownerId" TEXT,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "altText" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nexus"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "temporaryPasswordExpiresAt" TIMESTAMP(3),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "memberId" TEXT,
    "primaryBirdepId" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nexus"."Role" (
    "id" TEXT NOT NULL,
    "code" "nexus"."UserRole" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nexus"."Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nexus"."RoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nexus"."RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nexus"."UserPermissionOverride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "effect" "nexus"."PermissionOverrideEffect" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPermissionOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nexus"."AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nexus"."ProgramWork" (
    "id" TEXT NOT NULL,
    "cabinetPeriodId" TEXT NOT NULL,
    "primaryBirdepId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "internalDescription" TEXT NOT NULL,
    "publicDescription" TEXT,
    "status" "nexus"."ProgramStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATE,
    "endDate" DATE,
    "coverImageId" TEXT,
    "pressReleaseId" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nexus"."ProgramCollaborator" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "birdepId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nexus"."ProgramPic" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramPic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nexus"."ProgramProgressUpdate" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "progressPercent" INTEGER NOT NULL,
    "updateText" TEXT NOT NULL,
    "internalIssue" TEXT,
    "internalFollowUp" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramProgressUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nexus"."ProgramIssue" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nexus"."ProgramFollowUp" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" DATE,
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nexus"."PressRelease" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" "nexus"."PressReleaseSourceType" NOT NULL,
    "url" TEXT,
    "publishedAt" TIMESTAMP(3),
    "status" "tevo"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PressRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nexus"."ImportBatch" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT,
    "dryRun" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL,
    "summary" JSONB,
    "createdById" TEXT,
    "committedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nexus"."ImportBatchRow" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "rawData" JSONB NOT NULL,
    "normalizedData" JSONB,
    "errors" JSONB,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatchRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tevo"."TevoSiteSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "status" "tevo"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TevoSiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tevo"."TevoLandingSection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "tevo"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TevoLandingSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tevo"."TevoOrganizationProfile" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "tevo"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TevoOrganizationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tevo"."TevoVisionMission" (
    "id" TEXT NOT NULL,
    "vision" TEXT NOT NULL,
    "missions" JSONB NOT NULL,
    "status" "tevo"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TevoVisionMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tevo"."TevoStructureContent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "status" "tevo"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TevoStructureContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tevo"."TevoPublicMemberProfile" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "publicTitle" TEXT,
    "instagram" TEXT,
    "bio" TEXT,
    "status" "tevo"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TevoPublicMemberProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tevo"."TevoPublicBirdepProfile" (
    "id" TEXT NOT NULL,
    "birdepId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "focusAreas" JSONB,
    "status" "tevo"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TevoPublicBirdepProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tevo"."TevoPublicProgramWork" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "statusLabel" TEXT,
    "status" "tevo"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TevoPublicProgramWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tevo"."TevoNewsArticle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "imageId" TEXT,
    "status" "tevo"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TevoNewsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tevo"."TevoStorePreview" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "status" "tevo"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TevoStorePreview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tevo"."TevoAngkasaCareContent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "tevo"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TevoAngkasaCareContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tevo"."TevoNavigationItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "tevo"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TevoNavigationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tevo"."TevoFooterContent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "status" "tevo"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TevoFooterContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tevo"."TevoApprovalRequest" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "status" "tevo"."PublishStatus" NOT NULL DEFAULT 'IN_REVIEW',
    "note" TEXT,
    "submittedById" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TevoApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaAsset_ownerType_ownerId_idx" ON "core"."MediaAsset"("ownerType", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "nexus"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_memberId_key" ON "nexus"."User"("memberId");

-- CreateIndex
CREATE INDEX "User_primaryBirdepId_idx" ON "nexus"."User"("primaryBirdepId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "nexus"."Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "nexus"."Permission"("code");

-- CreateIndex
CREATE INDEX "Permission_group_idx" ON "nexus"."Permission"("group");

-- CreateIndex
CREATE UNIQUE INDEX "RoleAssignment_userId_roleId_key" ON "nexus"."RoleAssignment"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "nexus"."RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermissionOverride_userId_permissionId_key" ON "nexus"."UserPermissionOverride"("userId", "permissionId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "nexus"."AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "nexus"."AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "nexus"."AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramWork_pressReleaseId_key" ON "nexus"."ProgramWork"("pressReleaseId");

-- CreateIndex
CREATE INDEX "ProgramWork_primaryBirdepId_idx" ON "nexus"."ProgramWork"("primaryBirdepId");

-- CreateIndex
CREATE INDEX "ProgramWork_status_idx" ON "nexus"."ProgramWork"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramWork_cabinetPeriodId_slug_key" ON "nexus"."ProgramWork"("cabinetPeriodId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramCollaborator_programId_birdepId_key" ON "nexus"."ProgramCollaborator"("programId", "birdepId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramPic_programId_memberId_key" ON "nexus"."ProgramPic"("programId", "memberId");

-- CreateIndex
CREATE INDEX "ProgramProgressUpdate_programId_createdAt_idx" ON "nexus"."ProgramProgressUpdate"("programId", "createdAt");

-- CreateIndex
CREATE INDEX "ProgramIssue_programId_idx" ON "nexus"."ProgramIssue"("programId");

-- CreateIndex
CREATE INDEX "ProgramFollowUp_programId_idx" ON "nexus"."ProgramFollowUp"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "PressRelease_programId_key" ON "nexus"."PressRelease"("programId");

-- CreateIndex
CREATE INDEX "PressRelease_status_idx" ON "nexus"."PressRelease"("status");

-- CreateIndex
CREATE INDEX "ImportBatch_type_status_idx" ON "nexus"."ImportBatch"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ImportBatchRow_batchId_rowNumber_key" ON "nexus"."ImportBatchRow"("batchId", "rowNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TevoSiteSetting_key_key" ON "tevo"."TevoSiteSetting"("key");

-- CreateIndex
CREATE INDEX "TevoSiteSetting_status_idx" ON "tevo"."TevoSiteSetting"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TevoLandingSection_slug_key" ON "tevo"."TevoLandingSection"("slug");

-- CreateIndex
CREATE INDEX "TevoLandingSection_status_sortOrder_idx" ON "tevo"."TevoLandingSection"("status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TevoOrganizationProfile_slug_key" ON "tevo"."TevoOrganizationProfile"("slug");

-- CreateIndex
CREATE INDEX "TevoOrganizationProfile_status_idx" ON "tevo"."TevoOrganizationProfile"("status");

-- CreateIndex
CREATE INDEX "TevoVisionMission_status_idx" ON "tevo"."TevoVisionMission"("status");

-- CreateIndex
CREATE INDEX "TevoStructureContent_status_idx" ON "tevo"."TevoStructureContent"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TevoPublicMemberProfile_memberId_key" ON "tevo"."TevoPublicMemberProfile"("memberId");

-- CreateIndex
CREATE INDEX "TevoPublicMemberProfile_status_idx" ON "tevo"."TevoPublicMemberProfile"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TevoPublicBirdepProfile_birdepId_key" ON "tevo"."TevoPublicBirdepProfile"("birdepId");

-- CreateIndex
CREATE INDEX "TevoPublicBirdepProfile_status_idx" ON "tevo"."TevoPublicBirdepProfile"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TevoPublicProgramWork_programId_key" ON "tevo"."TevoPublicProgramWork"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "TevoPublicProgramWork_slug_key" ON "tevo"."TevoPublicProgramWork"("slug");

-- CreateIndex
CREATE INDEX "TevoPublicProgramWork_status_idx" ON "tevo"."TevoPublicProgramWork"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TevoNewsArticle_slug_key" ON "tevo"."TevoNewsArticle"("slug");

-- CreateIndex
CREATE INDEX "TevoNewsArticle_status_publishedAt_idx" ON "tevo"."TevoNewsArticle"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "TevoStorePreview_status_idx" ON "tevo"."TevoStorePreview"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TevoAngkasaCareContent_slug_key" ON "tevo"."TevoAngkasaCareContent"("slug");

-- CreateIndex
CREATE INDEX "TevoAngkasaCareContent_status_idx" ON "tevo"."TevoAngkasaCareContent"("status");

-- CreateIndex
CREATE INDEX "TevoNavigationItem_status_sortOrder_idx" ON "tevo"."TevoNavigationItem"("status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TevoFooterContent_slug_key" ON "tevo"."TevoFooterContent"("slug");

-- CreateIndex
CREATE INDEX "TevoFooterContent_status_idx" ON "tevo"."TevoFooterContent"("status");

-- CreateIndex
CREATE INDEX "TevoApprovalRequest_contentType_contentId_idx" ON "tevo"."TevoApprovalRequest"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "TevoApprovalRequest_status_idx" ON "tevo"."TevoApprovalRequest"("status");

-- CreateIndex
CREATE INDEX "Birdep_unitType_idx" ON "core"."Birdep"("unitType");

-- AddForeignKey
ALTER TABLE "core"."Member" ADD CONSTRAINT "Member_photoAssetId_fkey" FOREIGN KEY ("photoAssetId") REFERENCES "core"."MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."MediaAsset" ADD CONSTRAINT "MediaAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "nexus"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."User" ADD CONSTRAINT "User_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "core"."Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."User" ADD CONSTRAINT "User_primaryBirdepId_fkey" FOREIGN KEY ("primaryBirdepId") REFERENCES "core"."Birdep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."RoleAssignment" ADD CONSTRAINT "RoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "nexus"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."RoleAssignment" ADD CONSTRAINT "RoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "nexus"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "nexus"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "nexus"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."UserPermissionOverride" ADD CONSTRAINT "UserPermissionOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "nexus"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."UserPermissionOverride" ADD CONSTRAINT "UserPermissionOverride_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "nexus"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "nexus"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."ProgramWork" ADD CONSTRAINT "ProgramWork_cabinetPeriodId_fkey" FOREIGN KEY ("cabinetPeriodId") REFERENCES "core"."CabinetPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."ProgramWork" ADD CONSTRAINT "ProgramWork_primaryBirdepId_fkey" FOREIGN KEY ("primaryBirdepId") REFERENCES "core"."Birdep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."ProgramWork" ADD CONSTRAINT "ProgramWork_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "core"."MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."ProgramWork" ADD CONSTRAINT "ProgramWork_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "nexus"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."ProgramWork" ADD CONSTRAINT "ProgramWork_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "nexus"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."ProgramCollaborator" ADD CONSTRAINT "ProgramCollaborator_programId_fkey" FOREIGN KEY ("programId") REFERENCES "nexus"."ProgramWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."ProgramCollaborator" ADD CONSTRAINT "ProgramCollaborator_birdepId_fkey" FOREIGN KEY ("birdepId") REFERENCES "core"."Birdep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."ProgramPic" ADD CONSTRAINT "ProgramPic_programId_fkey" FOREIGN KEY ("programId") REFERENCES "nexus"."ProgramWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."ProgramPic" ADD CONSTRAINT "ProgramPic_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "core"."Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."ProgramProgressUpdate" ADD CONSTRAINT "ProgramProgressUpdate_programId_fkey" FOREIGN KEY ("programId") REFERENCES "nexus"."ProgramWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."ProgramProgressUpdate" ADD CONSTRAINT "ProgramProgressUpdate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "nexus"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."ProgramIssue" ADD CONSTRAINT "ProgramIssue_programId_fkey" FOREIGN KEY ("programId") REFERENCES "nexus"."ProgramWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."ProgramIssue" ADD CONSTRAINT "ProgramIssue_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "nexus"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."ProgramFollowUp" ADD CONSTRAINT "ProgramFollowUp_programId_fkey" FOREIGN KEY ("programId") REFERENCES "nexus"."ProgramWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."ProgramFollowUp" ADD CONSTRAINT "ProgramFollowUp_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "nexus"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."PressRelease" ADD CONSTRAINT "PressRelease_programId_fkey" FOREIGN KEY ("programId") REFERENCES "nexus"."ProgramWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."PressRelease" ADD CONSTRAINT "PressRelease_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "nexus"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."ImportBatch" ADD CONSTRAINT "ImportBatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "nexus"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."ImportBatchRow" ADD CONSTRAINT "ImportBatchRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "nexus"."ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tevo"."TevoPublicMemberProfile" ADD CONSTRAINT "TevoPublicMemberProfile_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "core"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tevo"."TevoPublicBirdepProfile" ADD CONSTRAINT "TevoPublicBirdepProfile_birdepId_fkey" FOREIGN KEY ("birdepId") REFERENCES "core"."Birdep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tevo"."TevoPublicProgramWork" ADD CONSTRAINT "TevoPublicProgramWork_programId_fkey" FOREIGN KEY ("programId") REFERENCES "nexus"."ProgramWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tevo"."TevoNewsArticle" ADD CONSTRAINT "TevoNewsArticle_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "core"."MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tevo"."TevoApprovalRequest" ADD CONSTRAINT "TevoApprovalRequest_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "nexus"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tevo"."TevoApprovalRequest" ADD CONSTRAINT "TevoApprovalRequest_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "nexus"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

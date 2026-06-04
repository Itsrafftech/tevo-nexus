-- CreateEnum
CREATE TYPE "core"."OrganizationalPosition" AS ENUM ('KETUA_ORGANISASI', 'WAKIL_KETUA_ORGANISASI', 'SEKRETARIS_INTERNAL', 'SEKRETARIS_EKSTERNAL', 'BENDAHARA_INTERNAL', 'BENDAHARA_EKSTERNAL', 'KETUA_BIRDEP', 'SEKRETARIS_BIRDEP', 'BENDAHARA_BIRDEP', 'ANGGOTA_BIRDEP');

-- CreateTable
CREATE TABLE "core"."Member" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nim" TEXT NOT NULL,
    "instagram" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."Membership" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "cabinetPeriodId" TEXT NOT NULL,
    "primaryBirdepId" TEXT NOT NULL,
    "organizationalPosition" "core"."OrganizationalPosition" NOT NULL,
    "internalTitle" TEXT,
    "subdivision" TEXT,
    "programRoles" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_nim_key" ON "core"."Member"("nim");

-- CreateIndex
CREATE INDEX "Membership_cabinetPeriodId_idx" ON "core"."Membership"("cabinetPeriodId");

-- CreateIndex
CREATE INDEX "Membership_primaryBirdepId_idx" ON "core"."Membership"("primaryBirdepId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_memberId_cabinetPeriodId_key" ON "core"."Membership"("memberId", "cabinetPeriodId");

-- AddForeignKey
ALTER TABLE "core"."Membership" ADD CONSTRAINT "Membership_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "core"."Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Membership" ADD CONSTRAINT "Membership_cabinetPeriodId_fkey" FOREIGN KEY ("cabinetPeriodId") REFERENCES "core"."CabinetPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Membership" ADD CONSTRAINT "Membership_primaryBirdepId_fkey" FOREIGN KEY ("primaryBirdepId") REFERENCES "core"."Birdep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

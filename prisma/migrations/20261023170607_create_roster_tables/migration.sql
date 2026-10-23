-- CreateEnum
CREATE TYPE "PositionStatus" AS ENUM ('current', 'past');

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "photo" TEXT,
    "lodge" TEXT NOT NULL,
    "pastMasterYears" INTEGER[],
    "honorific" TEXT,
    "currentLodgeOffice" TEXT,
    "notes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistrictPosition" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "PositionStatus" NOT NULL,
    "startYear" INTEGER,
    "endYear" INTEGER,

    CONSTRAINT "DistrictPosition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Member_name_idx" ON "Member"("name");

-- CreateIndex
CREATE INDEX "Member_lodge_idx" ON "Member"("lodge");

-- CreateIndex
CREATE INDEX "DistrictPosition_memberId_idx" ON "DistrictPosition"("memberId");

-- AddForeignKey
ALTER TABLE "DistrictPosition" ADD CONSTRAINT "DistrictPosition_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

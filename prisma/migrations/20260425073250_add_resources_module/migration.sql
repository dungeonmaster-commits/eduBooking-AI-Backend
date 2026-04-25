-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ResourceType" ADD VALUE 'YOUTUBE_VIDEO';
ALTER TYPE "ResourceType" ADD VALUE 'YOUTUBE_PLAYLIST';
ALTER TYPE "ResourceType" ADD VALUE 'UDEMY_COURSE';
ALTER TYPE "ResourceType" ADD VALUE 'COURSERA_COURSE';
ALTER TYPE "ResourceType" ADD VALUE 'STUDY_MATERIAL';

-- AlterTable
ALTER TABLE "resources" ADD COLUMN     "branch" TEXT[],
ADD COLUMN     "difficultyLevel" "DifficultyLevel" NOT NULL DEFAULT 'BEGINNER',
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "enrolledCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "externalData" JSONB,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "externalPlatform" TEXT,
ADD COLUMN     "externalUrl" TEXT,
ADD COLUMN     "isExternal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "semester" INTEGER[],
ADD COLUMN     "totalRatings" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "price" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "resource_ratings" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_ratings_resourceId_userId_key" ON "resource_ratings"("resourceId", "userId");

-- AddForeignKey
ALTER TABLE "resource_ratings" ADD CONSTRAINT "resource_ratings_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_ratings" ADD CONSTRAINT "resource_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

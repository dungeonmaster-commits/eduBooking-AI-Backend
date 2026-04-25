-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DROPPED');

-- DropForeignKey
ALTER TABLE "progress" DROP CONSTRAINT "progress_resourceId_fkey";

-- DropForeignKey
ALTER TABLE "progress" DROP CONSTRAINT "progress_userId_fkey";

-- AlterTable
ALTER TABLE "progress" ADD COLUMN     "externalPlatform" TEXT,
ADD COLUMN     "externalUrl" TEXT,
ADD COLUMN     "isExternal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "personalRating" INTEGER,
ADD COLUMN     "sessionCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "timeSpentMins" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

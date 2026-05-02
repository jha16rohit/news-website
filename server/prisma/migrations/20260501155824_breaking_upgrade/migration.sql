-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM');

-- AlterTable
ALTER TABLE "News" ADD COLUMN     "expiryTime" TIMESTAMP(3),
ADD COLUMN     "priority" TEXT DEFAULT 'Medium',
ADD COLUMN     "statusType" TEXT DEFAULT 'published';

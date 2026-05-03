-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM');

-- AlterTable
ALTER TABLE "News" ADD COLUMN     "priority" TEXT;

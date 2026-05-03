/*
  Warnings:

  - The values [VIDEO] on the enum `ArticleType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `videoDuration` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `videoQuality` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `News` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ArticleType_new" AS ENUM ('STANDARD', 'BREAKING', 'LIVE');
ALTER TABLE "News" ALTER COLUMN "articleType" DROP DEFAULT;
ALTER TABLE "News" ALTER COLUMN "articleType" TYPE "ArticleType_new" USING ("articleType"::text::"ArticleType_new");
ALTER TYPE "ArticleType" RENAME TO "ArticleType_old";
ALTER TYPE "ArticleType_new" RENAME TO "ArticleType";
DROP TYPE "ArticleType_old";
ALTER TABLE "News" ALTER COLUMN "articleType" SET DEFAULT 'STANDARD';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Status" ADD VALUE 'EXPIRED';
ALTER TYPE "Status" ADD VALUE 'DELETED';

-- AlterTable
ALTER TABLE "News" DROP COLUMN "videoDuration",
DROP COLUMN "videoQuality",
DROP COLUMN "videoUrl",
ADD COLUMN     "deleteAfter" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "excerpt" TEXT;

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "isTrending" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "Priority";

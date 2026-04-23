-- AlterTable
ALTER TABLE "News" ADD COLUMN     "breakingHomepageAlert" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "breakingNewsTicker" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "breakingPushNotif" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canonicalUrl" TEXT,
ADD COLUMN     "focusKeywords" TEXT,
ADD COLUMN     "liveUpdates" JSONB,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "videoDuration" INTEGER,
ADD COLUMN     "videoQuality" TEXT,
ADD COLUMN     "videoUrl" TEXT;

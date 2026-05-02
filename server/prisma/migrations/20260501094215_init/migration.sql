-- CreateEnum
CREATE TYPE "ArticleType" AS ENUM ('STANDARD', 'BREAKING', 'LIVE', 'VIDEO');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "shortTitle" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'English',
    "location" TEXT,
    "tags" TEXT[],
    "articleType" "ArticleType" NOT NULL DEFAULT 'STANDARD',
    "breakingNewsTicker" BOOLEAN NOT NULL DEFAULT false,
    "breakingPushNotif" BOOLEAN NOT NULL DEFAULT false,
    "breakingHomepageAlert" BOOLEAN NOT NULL DEFAULT false,
    "liveUpdates" JSONB,
    "videoUrl" TEXT,
    "videoDuration" INTEGER,
    "videoQuality" TEXT,
    "featuredImage" TEXT,
    "imageCaption" TEXT,
    "photoCredit" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "slug" TEXT NOT NULL,
    "keywords" TEXT[],
    "focusKeywords" TEXT,
    "canonicalUrl" TEXT,
    "status" "Status" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "topicProfileId" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "caption" TEXT,
    "description" TEXT NOT NULL,
    "instagram" TEXT,
    "facebook" TEXT,
    "twitter" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "News_slug_key" ON "News"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TopicProfile_slug_key" ON "TopicProfile"("slug");

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_topicProfileId_fkey" FOREIGN KEY ("topicProfileId") REFERENCES "TopicProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

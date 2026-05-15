-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'EDITOR');

-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'ARCHIVED';

-- CreateTable
CREATE TABLE "SiteUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT,
    "googleId" TEXT,
    "profilePic" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReadHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReadHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteUser_email_key" ON "SiteUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SiteUser_googleId_key" ON "SiteUser"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserReadHistory_userId_newsId_key" ON "UserReadHistory"("userId", "newsId");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_newsId_key" ON "Bookmark"("userId", "newsId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsLike_userId_newsId_key" ON "NewsLike"("userId", "newsId");

-- AddForeignKey
ALTER TABLE "UserReadHistory" ADD CONSTRAINT "UserReadHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SiteUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReadHistory" ADD CONSTRAINT "UserReadHistory_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SiteUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SiteUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsLike" ADD CONSTRAINT "NewsLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SiteUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsLike" ADD CONSTRAINT "NewsLike_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;

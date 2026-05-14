-- CreateEnum
CREATE TYPE "AdInquiryStatus" AS ENUM ('pending', 'reviewed', 'approved', 'published', 'rejected');

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "replied" BOOLEAN NOT NULL DEFAULT false,
    "replyText" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdInquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "message" TEXT,
    "budget" TEXT,
    "targetPage" TEXT,
    "duration" TEXT,
    "customDays" INTEGER,
    "adType" TEXT,
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    "adTitle" TEXT,
    "status" "AdInquiryStatus" NOT NULL DEFAULT 'pending',
    "adminNote" TEXT,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishedAd" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "altText" TEXT,
    "targetPage" TEXT,
    "adTitle" TEXT,
    "advertiser" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublishedAd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdPageSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "whyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "whyPoints" JSONB NOT NULL DEFAULT '[]',
    "packagesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "packages" JSONB NOT NULL DEFAULT '[]',
    "contactEnabled" BOOLEAN NOT NULL DEFAULT true,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactNote" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPageSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublishedAd_inquiryId_key" ON "PublishedAd"("inquiryId");

-- AddForeignKey
ALTER TABLE "PublishedAd" ADD CONSTRAINT "PublishedAd_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "AdInquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

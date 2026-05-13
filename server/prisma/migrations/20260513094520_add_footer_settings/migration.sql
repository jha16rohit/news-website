-- CreateTable
CREATE TABLE "FooterSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "sectionTitle" TEXT NOT NULL DEFAULT 'STAY UPDATED',
    "descriptionText" TEXT NOT NULL DEFAULT 'Get the latest headlines, breaking news, and exclusive updates delivered straight to your inbox.',
    "trustedText" TEXT NOT NULL DEFAULT 'Your trusted source for accurate and timely news coverage around the clock.',
    "images" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FooterSettings_pkey" PRIMARY KEY ("id")
);

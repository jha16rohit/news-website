-- CreateTable
CREATE TABLE "ContactUsSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroVisible" BOOLEAN NOT NULL DEFAULT true,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "contactInfoVisible" BOOLEAN NOT NULL DEFAULT true,
    "formVisible" BOOLEAN NOT NULL DEFAULT true,
    "formTitle" TEXT,
    "formSubtitle" TEXT,
    "formSuccessMsg" TEXT,
    "subjectOptions" JSONB,
    "faqVisible" BOOLEAN NOT NULL DEFAULT true,
    "faqTitle" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactUsSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactInfo" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ContactInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQItem" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FAQItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ContactInfo" ADD CONSTRAINT "ContactInfo_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "ContactUsSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FAQItem" ADD CONSTRAINT "FAQItem_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "ContactUsSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

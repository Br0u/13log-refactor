CREATE TABLE "CatSettings" (
  "id" TEXT NOT NULL DEFAULT 'singleton',
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "baseUrl" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "encryptedKey" TEXT,
  "personality" TEXT NOT NULL,
  "proactiveSeconds" INTEGER NOT NULL DEFAULT 120,
  "dailyLimit" INTEGER NOT NULL DEFAULT 200,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatSettings_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CatUsage" (
  "id" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatUsage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CatUsage_expiresAt_idx" ON "CatUsage"("expiresAt");

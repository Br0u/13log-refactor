-- CreateTable
CREATE TABLE "access_logs" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "riskScore" INTEGER NOT NULL,
    "riskLabel" TEXT NOT NULL,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blacklist" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "access_logs_createdAt_idx" ON "access_logs"("createdAt");

-- CreateIndex
CREATE INDEX "access_logs_ipHash_createdAt_idx" ON "access_logs"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "access_logs_riskLabel_createdAt_idx" ON "access_logs"("riskLabel", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "blacklist_ipHash_key" ON "blacklist"("ipHash");

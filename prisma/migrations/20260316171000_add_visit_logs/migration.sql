-- CreateTable
CREATE TABLE "VisitLog" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "referer" TEXT,
    "ipSummary" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisitLog_createdAt_idx" ON "VisitLog"("createdAt");

-- CreateIndex
CREATE INDEX "VisitLog_path_idx" ON "VisitLog"("path");

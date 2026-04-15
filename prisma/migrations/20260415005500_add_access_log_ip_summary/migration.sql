-- AlterTable
ALTER TABLE "access_logs"
ADD COLUMN "ipSummary" TEXT NOT NULL DEFAULT 'unknown';

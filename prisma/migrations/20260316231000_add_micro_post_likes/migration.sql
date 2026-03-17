-- AlterTable
ALTER TABLE "MicroPost" ADD COLUMN "likeCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "MicroPostLike" (
    "id" TEXT NOT NULL,
    "microPostId" TEXT NOT NULL,
    "visitorKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MicroPostLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MicroPostLike_microPostId_visitorKey_key" ON "MicroPostLike"("microPostId", "visitorKey");

-- AddForeignKey
ALTER TABLE "MicroPostLike" ADD CONSTRAINT "MicroPostLike_microPostId_fkey" FOREIGN KEY ("microPostId") REFERENCES "MicroPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "MicroPost" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MicroPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MicroPostTag" (
    "microPostId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "MicroPostTag_pkey" PRIMARY KEY ("microPostId","tagId")
);

-- AddForeignKey
ALTER TABLE "MicroPostTag" ADD CONSTRAINT "MicroPostTag_microPostId_fkey" FOREIGN KEY ("microPostId") REFERENCES "MicroPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MicroPostTag" ADD CONSTRAINT "MicroPostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

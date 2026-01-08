-- AlterTable
ALTER TABLE "UploadJob" ADD COLUMN "userId" INTEGER;

-- CreateIndex
CREATE INDEX "UploadJob_userId_idx" ON "UploadJob"("userId");

-- AddForeignKey
ALTER TABLE "UploadJob" ADD CONSTRAINT "UploadJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

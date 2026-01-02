-- AlterTable
ALTER TABLE "InvoiceLine" ADD COLUMN     "managerNormalized" TEXT,
ADD COLUMN     "managerUserId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "nameNormalized" TEXT;

-- CreateIndex
CREATE INDEX "InvoiceLine_managerUserId_idx" ON "InvoiceLine"("managerUserId");

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_managerUserId_fkey" FOREIGN KEY ("managerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

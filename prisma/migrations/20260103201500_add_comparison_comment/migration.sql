-- CreateEnum
CREATE TYPE "CommentKind" AS ENUM ('REPORT_ERROR', 'VALIDATE_DIFFERENCE');

-- CreateTable
CREATE TABLE "ComparisonComment" (
    "id" SERIAL NOT NULL,
    "kind" "CommentKind" NOT NULL,
    "message" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,

    CONSTRAINT "ComparisonComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComparisonComment_userId_idx" ON "ComparisonComment"("userId");

-- CreateIndex
CREATE INDEX "ComparisonComment_clientId_serviceId_year_month_idx" ON "ComparisonComment"("clientId", "serviceId", "year", "month");

-- AddForeignKey
ALTER TABLE "ComparisonComment" ADD CONSTRAINT "ComparisonComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonComment" ADD CONSTRAINT "ComparisonComment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonComment" ADD CONSTRAINT "ComparisonComment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

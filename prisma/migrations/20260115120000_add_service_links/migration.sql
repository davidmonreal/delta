-- CreateTable
CREATE TABLE "ServiceLink" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "linkedServiceId" INTEGER NOT NULL,
    "offsetMonths" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceLink_serviceId_linkedServiceId_offsetMonths_key" ON "ServiceLink"("serviceId", "linkedServiceId", "offsetMonths");

-- CreateIndex
CREATE INDEX "ServiceLink_serviceId_idx" ON "ServiceLink"("serviceId");

-- CreateIndex
CREATE INDEX "ServiceLink_linkedServiceId_idx" ON "ServiceLink"("linkedServiceId");

-- AddForeignKey
ALTER TABLE "ServiceLink" ADD CONSTRAINT "ServiceLink_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceLink" ADD CONSTRAINT "ServiceLink_linkedServiceId_fkey" FOREIGN KEY ("linkedServiceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

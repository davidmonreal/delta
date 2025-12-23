-- CreateTable
CREATE TABLE "Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nameRaw" TEXT NOT NULL,
    "nameNormalized" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Service" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conceptRaw" TEXT NOT NULL,
    "conceptNormalized" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "units" REAL NOT NULL,
    "price" REAL NOT NULL,
    "total" REAL NOT NULL,
    "manager" TEXT NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "series" TEXT,
    "albaran" TEXT,
    "numero" TEXT,
    "clientId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    CONSTRAINT "InvoiceLine_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InvoiceLine_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_nameNormalized_key" ON "Client"("nameNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "Service_conceptNormalized_key" ON "Service"("conceptNormalized");

-- CreateIndex
CREATE INDEX "InvoiceLine_year_month_idx" ON "InvoiceLine"("year", "month");

-- CreateIndex
CREATE INDEX "InvoiceLine_clientId_serviceId_idx" ON "InvoiceLine"("clientId", "serviceId");

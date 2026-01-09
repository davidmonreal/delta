CREATE INDEX IF NOT EXISTS "InvoiceLine_managerUserId_date_idx"
ON "InvoiceLine"("managerUserId", "date" DESC);

CREATE INDEX IF NOT EXISTS "InvoiceLine_clientId_managerUserId_date_idx"
ON "InvoiceLine"("clientId", "managerUserId", "date" DESC);

CREATE INDEX IF NOT EXISTS "InvoiceLine_clientId_year_month_managerUserId_idx"
ON "InvoiceLine"("clientId", "year", "month", "managerUserId");

CREATE INDEX IF NOT EXISTS "InvoiceLine_clientId_year_month_date_idx"
ON "InvoiceLine"("clientId", "year", "month", "date" DESC);

CREATE INDEX IF NOT EXISTS "InvoiceLine_sourceFile_idx"
ON "InvoiceLine"("sourceFile");

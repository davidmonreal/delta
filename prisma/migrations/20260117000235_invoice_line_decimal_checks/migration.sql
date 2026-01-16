-- Convert monetary fields to decimals and add integrity checks.
ALTER TABLE "InvoiceLine"
  ALTER COLUMN "units" TYPE DECIMAL(12,3) USING "units"::decimal(12,3),
  ALTER COLUMN "price" TYPE DECIMAL(12,2) USING "price"::decimal(12,2),
  ALTER COLUMN "total" TYPE DECIMAL(12,2) USING "total"::decimal(12,2);

ALTER TABLE "InvoiceLine"
  ADD CONSTRAINT "InvoiceLine_month_check" CHECK ("month" BETWEEN 1 AND 12),
  ADD CONSTRAINT "InvoiceLine_year_check" CHECK ("year" >= 2000);

import fs from "node:fs";
import path from "node:path";

import * as XLSX from "xlsx";

import { prisma } from "../src/lib/db";

type Row = Record<string, unknown>;

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function normalizeValue(value: string) {
  return value.replace(/\s+/g, " ").trim().toUpperCase();
}

function toOptionalString(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/\s+/g, "").replace(",", ".");
    const parsed = Number.parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function parseDate(value: unknown) {
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return new Date(parsed.y, parsed.m - 1, parsed.d);
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function buildHeaderMap(sample: Row) {
  const map = new Map<string, string>();
  for (const key of Object.keys(sample)) {
    map.set(normalizeHeader(key), key);
  }
  return map;
}

function getValue(row: Row, headerMap: Map<string, string>, key: string) {
  const normalized = normalizeHeader(key);
  const resolvedKey = headerMap.get(normalized);
  if (!resolvedKey) return null;
  return row[resolvedKey];
}

async function getClientId(
  nameRaw: string,
  cache: Map<string, number>,
) {
  const normalized = normalizeValue(nameRaw);
  const cached = cache.get(normalized);
  if (cached) return cached;
  const client = await prisma.client.upsert({
    where: { nameNormalized: normalized },
    update: {},
    create: {
      nameRaw,
      nameNormalized: normalized,
    },
  });
  cache.set(normalized, client.id);
  return client.id;
}

async function getServiceId(
  conceptRaw: string,
  cache: Map<string, number>,
) {
  const normalized = normalizeValue(conceptRaw);
  const cached = cache.get(normalized);
  if (cached) return cached;
  const service = await prisma.service.upsert({
    where: { conceptNormalized: normalized },
    update: {},
    create: {
      conceptRaw,
      conceptNormalized: normalized,
    },
  });
  cache.set(normalized, service.id);
  return service.id;
}

async function importFile(filePath: string, reset: boolean) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: null });
  if (rows.length === 0) return 0;

  const sourceFile = path.basename(filePath);
  const headerMap = buildHeaderMap(rows[0]);

  if (reset) {
    await prisma.invoiceLine.deleteMany({ where: { sourceFile } });
  }

  const clientCache = new Map<string, number>();
  const serviceCache = new Map<string, number>();
  const toCreate = [];

  for (const row of rows) {
    const dateValue = getValue(row, headerMap, "FECHA");
    const date = parseDate(dateValue);
    if (!date) continue;

    const clientRaw = String(getValue(row, headerMap, "CLIENTE") ?? "").trim();
    const conceptRaw = String(getValue(row, headerMap, "CONCEPTO") ?? "").trim();
    if (!clientRaw || !conceptRaw) continue;

    const units = toNumber(getValue(row, headerMap, "UNIDADES"));
    const price = toNumber(getValue(row, headerMap, "PRECIO"));
    const total = toNumber(getValue(row, headerMap, "TOTAL"));
    if (total < 0) continue;

    const clientId = await getClientId(clientRaw, clientCache);
    const serviceId = await getServiceId(conceptRaw, serviceCache);

    const manager = String(getValue(row, headerMap, "FACTURA") ?? "").trim();
    const series = toOptionalString(getValue(row, headerMap, "SERIE"));
    const albaran = toOptionalString(getValue(row, headerMap, "ALBARAN"));
    const numero = toOptionalString(getValue(row, headerMap, "NUMERO"));

    toCreate.push({
      date,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      units,
      price,
      total,
      manager,
      sourceFile,
      series,
      albaran,
      numero,
      clientId,
      serviceId,
    });
  }

  if (toCreate.length > 0) {
    await prisma.invoiceLine.createMany({ data: toCreate });
  }

  return toCreate.length;
}

async function main() {
  const args = process.argv.slice(2);
  const reset = args.includes("--reset");
  const paths = args.filter((arg) => !arg.startsWith("--"));

  const targetPaths =
    paths.length > 0
      ? paths
      : fs
          .readdirSync(path.join(process.cwd(), "data"))
          .filter((file) => file.endsWith(".xlsx"))
          .map((file) => path.join(process.cwd(), "data", file));

  if (targetPaths.length === 0) {
    throw new Error("No s'han trobat fitxers .xlsx per importar.");
  }

  let totalRows = 0;
  for (const filePath of targetPaths) {
    const imported = await importFile(filePath, reset);
    totalRows += imported;
    console.log(`Importat ${imported} files de ${path.basename(filePath)}.`);
  }

  console.log(`Importacio finalitzada. Files importades: ${totalRows}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

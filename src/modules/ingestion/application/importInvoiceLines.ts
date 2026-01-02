import path from "node:path";

import * as XLSX from "xlsx";

import type { IngestionRepository, InvoiceLineInput } from "../ports/ingestionRepository";
import { normalizeName } from "@/lib/normalize";

type Row = Record<string, unknown>;

type ImportParams = {
  rows: Row[];
  sourceFile: string;
  reset: boolean;
  repo: IngestionRepository;
  userLookup?: Map<string, number>;
};

export function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function normalizeValue(value: string) {
  return value.replace(/\s+/g, " ").trim().toUpperCase();
}

export function toOptionalString(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

export function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/\s+/g, "").replace(",", ".");
    const parsed = Number.parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function parseDate(value: unknown) {
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

async function getClientId(nameRaw: string, cache: Map<string, number>, repo: IngestionRepository) {
  const normalized = normalizeValue(nameRaw);
  const cached = cache.get(normalized);
  if (cached) return cached;
  const clientId = await repo.upsertClient(nameRaw, normalized);
  cache.set(normalized, clientId);
  return clientId;
}

async function getServiceId(conceptRaw: string, cache: Map<string, number>, repo: IngestionRepository) {
  const normalized = normalizeValue(conceptRaw);
  const cached = cache.get(normalized);
  if (cached) return cached;
  const serviceId = await repo.upsertService(conceptRaw, normalized);
  cache.set(normalized, serviceId);
  return serviceId;
}

export async function importRows({
  rows,
  sourceFile,
  reset,
  repo,
  userLookup,
}: ImportParams) {
  if (rows.length === 0) return 0;

  const headerMap = buildHeaderMap(rows[0]);

  if (reset) {
    await repo.deleteInvoiceLinesBySourceFile(sourceFile);
  }

  const clientCache = new Map<string, number>();
  const serviceCache = new Map<string, number>();
  const toCreate: InvoiceLineInput[] = [];

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

    const clientId = await getClientId(clientRaw, clientCache, repo);
    const serviceId = await getServiceId(conceptRaw, serviceCache, repo);

    const manager = String(getValue(row, headerMap, "FACTURA") ?? "").trim();
    const managerNormalized = manager.length ? normalizeName(manager) : null;
    const managerUserId =
      managerNormalized && userLookup ? userLookup.get(managerNormalized) ?? null : null;
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
      managerNormalized,
      sourceFile,
      series,
      albaran,
      numero,
      clientId,
      serviceId,
      managerUserId,
    });
  }

  return repo.createInvoiceLines(toCreate);
}

export async function importXlsxFile({
  filePath,
  reset,
  repo,
  userLookup,
}: {
  filePath: string;
  reset: boolean;
  repo: IngestionRepository;
  userLookup?: Map<string, number>;
}) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: null });
  const sourceFile = path.basename(filePath);

  return importRows({ rows, sourceFile, reset, repo, userLookup });
}

import path from "node:path";

import * as XLSX from "xlsx";

import type { IngestionRepository, InvoiceLineInput } from "../ports/ingestionRepository";
import {
  buildHeaderMap,
  normalizeHeader,
  validateHeaders,
  EXPECTED_HEADERS,
  OPTIONAL_HEADERS,
  REQUIRED_HEADERS,
  type HeaderValidationResult,
} from "../domain/headerUtils";
import { normalizeName } from "@/lib/normalize";

type Row = Record<string, unknown>;

export {
  buildHeaderMap,
  normalizeHeader,
  validateHeaders,
  EXPECTED_HEADERS,
  OPTIONAL_HEADERS,
  REQUIRED_HEADERS,
};
export type { HeaderValidationResult };

export type ImportRowError = {
  row: number;
  message: string;
};

type ImportParams = {
  rows: Row[];
  sourceFile: string;
  reset: boolean;
  repo: IngestionRepository;
  userCandidates?: { id: number; nameNormalized: string }[];
};

type BuildLinesParams = {
  rows: Row[];
  sourceFile: string;
  repo: IngestionRepository;
  userCandidates?: { id: number; nameNormalized: string }[];
  strict?: boolean;
  maxErrors?: number;
};

type ImportSummary = {
  imported: number;
  assigned: number;
  unmatched: number;
  skipped: number;
  errors: ImportRowError[];
};

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

export function toNumberOrNull(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/\s+/g, "").replace(",", ".");
    if (!cleaned.length) return null;
    const parsed = Number.parseFloat(cleaned);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
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

function getValue(row: Row, headerMap: Map<string, string>, key: string) {
  const normalized = normalizeHeader(key);
  const resolvedKey = headerMap.get(normalized);
  if (!resolvedKey) return null;
  return row[resolvedKey];
}

async function buildReferenceMaps(rows: Row[], headerMap: Map<string, string>, repo: IngestionRepository) {
  const clientRawByNormalized = new Map<string, string>();
  const serviceRawByNormalized = new Map<string, string>();

  for (const row of rows) {
    const clientRaw = String(getValue(row, headerMap, "CLIENTE") ?? "").trim();
    if (clientRaw) {
      const normalized = normalizeValue(clientRaw);
      if (!clientRawByNormalized.has(normalized)) {
        clientRawByNormalized.set(normalized, clientRaw);
      }
    }

    const conceptRaw = String(getValue(row, headerMap, "CONCEPTO") ?? "").trim();
    if (conceptRaw) {
      const normalized = normalizeValue(conceptRaw);
      if (!serviceRawByNormalized.has(normalized)) {
        serviceRawByNormalized.set(normalized, conceptRaw);
      }
    }
  }

  const clientNames = [...clientRawByNormalized.keys()];
  const serviceNames = [...serviceRawByNormalized.keys()];

  const [existingClients, existingServices] = await Promise.all([
    repo.findClientsByNormalized(clientNames),
    repo.findServicesByNormalized(serviceNames),
  ]);

  const clientIdMap = new Map(existingClients.map((client) => [client.nameNormalized, client.id]));
  const serviceIdMap = new Map(
    existingServices.map((service) => [service.conceptNormalized, service.id]),
  );

  const missingClients = clientNames.filter((name) => !clientIdMap.has(name));
  if (missingClients.length) {
    await repo.createClients(
      missingClients.map((nameNormalized) => ({
        nameRaw: clientRawByNormalized.get(nameNormalized) ?? nameNormalized,
        nameNormalized,
      })),
    );
    const createdClients = await repo.findClientsByNormalized(missingClients);
    for (const client of createdClients) {
      clientIdMap.set(client.nameNormalized, client.id);
    }
  }

  const missingServices = serviceNames.filter((name) => !serviceIdMap.has(name));
  if (missingServices.length) {
    await repo.createServices(
      missingServices.map((conceptNormalized) => ({
        conceptRaw: serviceRawByNormalized.get(conceptNormalized) ?? conceptNormalized,
        conceptNormalized,
      })),
    );
    const createdServices = await repo.findServicesByNormalized(missingServices);
    for (const service of createdServices) {
      serviceIdMap.set(service.conceptNormalized, service.id);
    }
  }

  return { clientIdMap, serviceIdMap };
}

export async function buildInvoiceLines({
  rows,
  sourceFile,
  repo,
  userCandidates,
  strict = true,
  maxErrors = 20,
}: BuildLinesParams): Promise<{
  lines: InvoiceLineInput[];
  skipped: number;
  errors: ImportRowError[];
}> {
  if (rows.length === 0) {
    return { lines: [], skipped: 0, errors: [] };
  }

  const headerMap = buildHeaderMap(rows[0]);
  const { clientIdMap, serviceIdMap } = await buildReferenceMaps(rows, headerMap, repo);
  const lines: InvoiceLineInput[] = [];
  const errors: ImportRowError[] = [];
  let skipped = 0;

  const recordError = (row: number, message: string) => {
    skipped += 1;
    if (errors.length < maxErrors) {
      errors.push({ row, message });
    }
  };

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const dateValue = getValue(row, headerMap, "FECHA");
    const date = parseDate(dateValue);
    if (!date) {
      recordError(rowNumber, "Data invalida.");
      continue;
    }

    const clientRaw = String(getValue(row, headerMap, "CLIENTE") ?? "").trim();
    if (!clientRaw) {
      recordError(rowNumber, "Falta el client.");
      continue;
    }

    const conceptRaw = String(getValue(row, headerMap, "CONCEPTO") ?? "").trim();
    if (!conceptRaw) {
      recordError(rowNumber, "Falta el concepte.");
      continue;
    }

    const unitsValue = strict
      ? toNumberOrNull(getValue(row, headerMap, "UNIDADES"))
      : toNumber(getValue(row, headerMap, "UNIDADES"));
    if (strict && unitsValue === null) {
      recordError(rowNumber, "Unitats invalides.");
      continue;
    }

    const priceValue = strict
      ? toNumberOrNull(getValue(row, headerMap, "PRECIO"))
      : toNumber(getValue(row, headerMap, "PRECIO"));
    if (strict && priceValue === null) {
      recordError(rowNumber, "Preu invalid.");
      continue;
    }

    const totalValue = strict
      ? toNumberOrNull(getValue(row, headerMap, "TOTAL"))
      : toNumber(getValue(row, headerMap, "TOTAL"));
    if (strict && totalValue === null) {
      recordError(rowNumber, "Total invalid.");
      continue;
    }

    const units = unitsValue ?? 0;
    const price = priceValue ?? 0;
    const total = totalValue ?? 0;
    if (total < 0) {
      recordError(rowNumber, "Total negatiu.");
      continue;
    }

    const clientNormalized = normalizeValue(clientRaw);
    const serviceNormalized = normalizeValue(conceptRaw);
    let clientId = clientIdMap.get(clientNormalized);
    if (!clientId) {
      clientId = await repo.upsertClient(clientRaw, clientNormalized);
      clientIdMap.set(clientNormalized, clientId);
    }
    let serviceId = serviceIdMap.get(serviceNormalized);
    if (!serviceId) {
      serviceId = await repo.upsertService(conceptRaw, serviceNormalized);
      serviceIdMap.set(serviceNormalized, serviceId);
    }

    const manager = String(getValue(row, headerMap, "FACTURA") ?? "").trim();
    const managerNormalized = manager.length ? normalizeName(manager) : null;
    const series = toOptionalString(getValue(row, headerMap, "SERIE"));
    if (!series) {
      recordError(rowNumber, "Falta la serie.");
      continue;
    }

    const albaran = toOptionalString(getValue(row, headerMap, "ALBARAN"));
    if (!albaran) {
      recordError(rowNumber, "Falta l'albara.");
      continue;
    }
    const numero = toOptionalString(getValue(row, headerMap, "NUMERO"));

    lines.push({
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
      managerUserId: null,
    });
  }

  return { lines, skipped, errors };
}

export async function importRowsWithSummary({
  rows,
  sourceFile,
  reset,
  repo,
  userCandidates,
  strict = true,
}: ImportParams & { strict?: boolean }): Promise<ImportSummary> {
  if (rows.length === 0) {
    return {
      imported: 0,
      assigned: 0,
      unmatched: 0,
      skipped: 0,
      errors: [],
    };
  }

  if (reset) {
    await repo.deleteInvoiceLinesBySourceFile(sourceFile);
  }

  const { lines, skipped, errors } = await buildInvoiceLines({
    rows,
    sourceFile,
    repo,
    userCandidates,
    strict,
  });
  const imported = await repo.createInvoiceLines(lines);
  const assigned = lines.filter((line) => line.managerUserId).length;
  const unmatched = lines.length - assigned;

  return {
    imported,
    assigned,
    unmatched,
    skipped,
    errors,
  };
}

export async function importRows({
  rows,
  sourceFile,
  reset,
  repo,
  userCandidates,
}: ImportParams) {
  const result = await importRowsWithSummary({
    rows,
    sourceFile,
    reset,
    repo,
    userCandidates,
    strict: false,
  });

  return result.imported;
}

export async function importXlsxFile({
  filePath,
  reset,
  repo,
  userCandidates,
}: {
  filePath: string;
  reset: boolean;
  repo: IngestionRepository;
  userCandidates?: { id: number; nameNormalized: string }[];
}) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: null });
  const sourceFile = path.basename(filePath);

  return importRows({ rows, sourceFile, reset, repo, userCandidates });
}

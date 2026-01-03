export const REQUIRED_HEADERS = [
  "FECHA",
  "CLIENTE",
  "CONCEPTO",
  "UNIDADES",
  "PRECIO",
  "TOTAL",
  "FACTURA",
  "SERIE",
  "ALBARAN",
] as const;

export const OPTIONAL_HEADERS = ["NUMERO"] as const;

export const EXPECTED_HEADERS = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS] as const;

export type HeaderValidationResult = {
  missing: string[];
  extra: string[];
};

type Row = Record<string, unknown>;

export function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function buildHeaderMap(sample: Row) {
  const map = new Map<string, string>();
  for (const key of Object.keys(sample)) {
    map.set(normalizeHeader(key), key);
  }
  return map;
}

export function validateHeaders(headerMap: Map<string, string>): HeaderValidationResult {
  const missing = REQUIRED_HEADERS.filter((header) => !headerMap.has(header));
  const extra = Array.from(headerMap.keys()).filter(
    (header) => !EXPECTED_HEADERS.includes(header as typeof EXPECTED_HEADERS[number]),
  );

  return { missing, extra };
}

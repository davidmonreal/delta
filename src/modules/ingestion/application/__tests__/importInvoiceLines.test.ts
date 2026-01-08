import { describe, expect, it } from "vitest";

import { importRows, importRowsWithSummary, validateHeaders } from "../importInvoiceLines";
import { InMemoryIngestionRepository } from "./testUtils";

const rows = [
  {
    FECHA: new Date("2024-01-15"),
    CLIENTE: "Client A",
    CONCEPTO: "Service A",
    UNIDADES: 10,
    PRECIO: 2,
    TOTAL: 20,
    FACTURA: "MGR",
    SERIE: "RB",
    ALBARAN: "68",
    NUMERO: "68",
  },
];

describe("importRows", () => {
  it("creates invoice lines from rows", async () => {
    const repo = new InMemoryIngestionRepository();
    const result = await importRows({
      rows,
      sourceFile: "file.xlsx",
      reset: false,
      repo,
    });

    expect(result).toBe(1);
    expect(repo.invoiceLines).toHaveLength(1);
    expect(repo.clients.size).toBe(1);
    expect(repo.services.size).toBe(1);
  });

  it("skips rows without required fields", async () => {
    const repo = new InMemoryIngestionRepository();
    const result = await importRows({
      rows: [{ FECHA: null }],
      sourceFile: "file.xlsx",
      reset: false,
      repo,
    });

    expect(result).toBe(0);
    expect(repo.invoiceLines).toHaveLength(0);
  });
});

describe("importRowsWithSummary", () => {
  it("returns counts for assigned and unmatched", async () => {
    const repo = new InMemoryIngestionRepository();
    const result = await importRowsWithSummary({
      rows,
      sourceFile: "file.xlsx",
      reset: false,
      repo,
      strict: true,
    });

    expect(result.imported).toBe(1);
    expect(result.assigned).toBe(0);
    expect(result.unmatched).toBe(1);
  });

  it("flags missing serie or albara values", async () => {
    const repo = new InMemoryIngestionRepository();
    const result = await importRowsWithSummary({
      rows: [
        {
          FECHA: new Date("2024-01-15"),
          CLIENTE: "Client A",
          CONCEPTO: "Service A",
          UNIDADES: 10,
          PRECIO: 2,
          TOTAL: 20,
          FACTURA: "MGR",
          SERIE: "",
          ALBARAN: null,
        },
      ],
      sourceFile: "file.xlsx",
      reset: false,
      repo,
      strict: true,
    });

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.errors.length).toBe(1);
  });
});

describe("validateHeaders", () => {
  it("detects missing headers", () => {
    const headerMap = new Map([["FECHA", "FECHA"]]);
    const result = validateHeaders(headerMap);

    expect(result.missing).toContain("CLIENTE");
  });
});

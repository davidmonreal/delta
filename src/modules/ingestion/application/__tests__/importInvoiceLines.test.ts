import { describe, expect, it } from "vitest";

import { importRows } from "../importInvoiceLines";
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

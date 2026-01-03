import { describe, expect, it, vi } from "vitest";

import { main } from "../import-xlsx";
import type { IngestionRepository } from "@/modules/ingestion/ports/ingestionRepository";
import type { UserRepository } from "@/modules/users/ports/userRepository";

function buildLogger() {
  return { log: vi.fn() };
}

describe("import-xlsx script", () => {
  it("throws when no files are provided", async () => {
    const ingestRepo: IngestionRepository = {
      upsertClient: vi.fn(),
      upsertService: vi.fn(),
      deleteInvoiceLinesBySourceFile: vi.fn(),
      createInvoiceLines: vi.fn(),
      getImportSummary: vi.fn(),
      disconnect: vi.fn(),
    };
    const userRepo: UserRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      listAll: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      disconnect: vi.fn(),
    };

    await expect(
      main({
        args: [],
        ingestRepo,
        userRepo,
        logger: buildLogger(),
      }),
    ).rejects.toThrow("Cal indicar fitxers .xlsx per importar.");
  });

  it("imports provided files and logs totals", async () => {
    const importFile = vi.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    const logger = buildLogger();
    const ingestRepo: IngestionRepository = {
      upsertClient: vi.fn(),
      upsertService: vi.fn(),
      deleteInvoiceLinesBySourceFile: vi.fn(),
      createInvoiceLines: vi.fn(),
      getImportSummary: vi.fn(),
      disconnect: vi.fn(),
    };
    const userRepo: UserRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      listAll: vi.fn().mockResolvedValue([
        { id: 1, name: "User", nameNormalized: null },
      ]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      disconnect: vi.fn(),
    };

    await main({
      args: ["/tmp/a.xlsx", "/tmp/b.xlsx", "--reset"],
      ingestRepo,
      userRepo,
      importFile,
      logger,
    });

    expect(importFile).toHaveBeenCalledTimes(2);
    expect(logger.log).toHaveBeenCalledWith("Importat 2 files de a.xlsx.");
    expect(logger.log).toHaveBeenCalledWith("Importat 1 files de b.xlsx.");
    expect(logger.log).toHaveBeenCalledWith("Importacio finalitzada. Files importades: 3.");
    expect(ingestRepo.disconnect).toHaveBeenCalled();
    expect(userRepo.disconnect).toHaveBeenCalled();
  });
});

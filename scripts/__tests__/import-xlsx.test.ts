import { describe, expect, it, vi } from "vitest";

import { main } from "../import-xlsx";

function buildLogger() {
  return { log: vi.fn() };
}

describe("import-xlsx script", () => {
  it("throws when no xlsx files are found", async () => {
    await expect(
      main({
        args: [],
        readDir: () => [],
        ingestRepo: { disconnect: vi.fn() } as never,
        userRepo: { listAll: vi.fn().mockResolvedValue([]), disconnect: vi.fn() } as never,
        logger: buildLogger(),
      }),
    ).rejects.toThrow("No s'han trobat fitxers .xlsx per importar.");
  });

  it("imports provided files and logs totals", async () => {
    const importFile = vi.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    const logger = buildLogger();
    const ingestRepo = { disconnect: vi.fn() } as never;
    const userRepo = {
      listAll: vi.fn().mockResolvedValue([
        { id: 1, name: "User", nameNormalized: null },
      ]),
      disconnect: vi.fn(),
    } as never;

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

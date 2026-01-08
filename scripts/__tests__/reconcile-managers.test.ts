import { describe, expect, it, vi } from "vitest";

import { main } from "../reconcile-managers";
import type { InvoiceRepository } from "@/modules/invoices/ports/invoiceRepository";
import type { UserRepository } from "@/modules/users/ports/userRepository";

describe("reconcile-managers script", () => {
  it("normalizes users and backfills managers", async () => {
    const update = vi.fn();
    const listAll = vi.fn().mockResolvedValue([
      { id: 1, name: "User One", nameNormalized: null, email: "a", role: "USER", passwordHash: "x" },
      { id: 2, name: null, nameNormalized: null, email: "b", role: "USER", passwordHash: "y" },
    ]);
    const userRepo: UserRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      listAll,
      create: vi.fn(),
      update,
      delete: vi.fn(),
      list: vi.fn(),
      disconnect: vi.fn(),
    };
    const invoiceRepo: InvoiceRepository = {
      listUnmatched: vi.fn(),
      assignManager: vi.fn(),
      assignManagersForUser: vi.fn(),
      countUnassignedByManagerName: vi.fn(),
      backfillManagers: vi.fn(),
      disconnect: vi.fn(),
    };
    const backfill = vi.fn().mockResolvedValue(3);
    const normalizer = vi.fn().mockReturnValue("USER ONE");
    const logger = { log: vi.fn() };

    await main({
      invoiceRepo,
      userRepo,
      backfill,
      normalizer,
      logger,
    });

    expect(update).toHaveBeenCalledWith(1, expect.objectContaining({ nameNormalized: "USER ONE" }));
    expect(backfill).toHaveBeenCalledWith({
      repo: invoiceRepo,
      userCandidates: [{ id: 1, nameNormalized: "USER ONE" }],
    });
    expect(logger.log).toHaveBeenCalledWith("Linies actualitzades: 3");
    expect(invoiceRepo.disconnect).toHaveBeenCalled();
    expect(userRepo.disconnect).toHaveBeenCalled();
  });
});

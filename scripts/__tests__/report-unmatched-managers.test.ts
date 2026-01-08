import { describe, expect, it, vi } from "vitest";

import { main } from "../report-unmatched-managers";
import type { InvoiceRepository } from "@/modules/invoices/ports/invoiceRepository";
import type { UserRepository } from "@/modules/users/ports/userRepository";

describe("report-unmatched-managers script", () => {
  it("logs top unmatched managers and flags existing users", async () => {
    const invoiceRepo: InvoiceRepository = {
      listUnmatched: vi.fn().mockResolvedValue([
        { id: 1, manager: "User A", managerNormalized: null },
        { id: 2, manager: "User A", managerNormalized: null },
        { id: 3, manager: "User B", managerNormalized: null },
      ]),
      assignManager: vi.fn(),
      assignManagersForUser: vi.fn(),
      countUnassignedByManagerName: vi.fn(),
      backfillManagers: vi.fn(),
      disconnect: vi.fn(),
    };
    const userRepo: UserRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      listAll: vi.fn().mockResolvedValue([
        { id: 1, name: "User A", nameNormalized: null },
      ]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      disconnect: vi.fn(),
    };
    const normalizer = vi.fn((value: string) => value.toUpperCase());
    const logger = { log: vi.fn() };

    await main({ invoiceRepo, userRepo, normalizer, logger });

    expect(logger.log).toHaveBeenCalledWith("Unmatched lines: 3");
    expect(logger.log).toHaveBeenCalledWith("Top unmatched managers:");
    expect(logger.log).toHaveBeenCalledWith("User A -> 2 (user exists)");
    expect(logger.log).toHaveBeenCalledWith("User B -> 1 ");
    expect(invoiceRepo.disconnect).toHaveBeenCalled();
    expect(userRepo.disconnect).toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from "vitest";

import { main } from "../report-unmatched-managers";

describe("report-unmatched-managers script", () => {
  it("logs top unmatched managers and flags existing users", async () => {
    const invoiceRepo = {
      listUnmatched: vi.fn().mockResolvedValue([
        { id: 1, manager: "User A", managerNormalized: null },
        { id: 2, manager: "User A", managerNormalized: null },
        { id: 3, manager: "User B", managerNormalized: null },
      ]),
      disconnect: vi.fn(),
    } as never;
    const userRepo = {
      listAll: vi.fn().mockResolvedValue([
        { id: 1, name: "User A", nameNormalized: null },
      ]),
      disconnect: vi.fn(),
    } as never;
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

import { describe, expect, it } from "vitest";

import { backfillManagers } from "../backfillManagers";
import type { InvoiceRepository } from "../../ports/invoiceRepository";

class InMemoryInvoiceRepository implements InvoiceRepository {
  lines: { id: number; managerNormalized: string | null }[] = [
    { id: 1, managerNormalized: "ALFA" },
    { id: 2, managerNormalized: "BETA" },
  ];

  async listUnmatched() {
    return [];
  }

  async assignManager() {
    return;
  }

  async assignManagerForClient() {
    return 0;
  }

  async assignManagersForUser() {
    return 0;
  }

  async countUnassignedByManagerName() {
    return 0;
  }

  async backfillManagers({
    userCandidates,
  }: {
    userCandidates: { id: number; nameNormalized: string }[];
    onProgress?: (progress: { processed: number; total: number }) => Promise<void> | void;
  }) {
    let updated = 0;
    for (const line of this.lines) {
      if (!line.managerNormalized) continue;
      if (userCandidates.some((user) => user.nameNormalized === line.managerNormalized)) {
        updated += 1;
      }
    }
    return updated;
  }
}

describe("backfillManagers", () => {
  it("returns number of updated lines", async () => {
    const repo = new InMemoryInvoiceRepository();
    const userCandidates = [{ id: 1, nameNormalized: "ALFA" }];
    const updated = await backfillManagers({ repo, userCandidates });
    expect(updated).toBe(1);
  });
});

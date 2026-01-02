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

  async backfillManagers({ userLookup }: { userLookup: Map<string, number> }) {
    let updated = 0;
    for (const line of this.lines) {
      if (!line.managerNormalized) continue;
      if (userLookup.has(line.managerNormalized)) {
        updated += 1;
      }
    }
    return updated;
  }
}

describe("backfillManagers", () => {
  it("returns number of updated lines", async () => {
    const repo = new InMemoryInvoiceRepository();
    const userLookup = new Map([["ALFA", 1]]);
    const updated = await backfillManagers({ repo, userLookup });
    expect(updated).toBe(1);
  });
});

import { describe, expect, it } from "vitest";

import { listUnmatched } from "../listUnmatched";
import type { InvoiceQueryRepository } from "../../ports/invoiceRepository";

class InMemoryInvoiceRepository implements InvoiceQueryRepository {
  async listUnmatched() {
    return [
      {
        id: 1,
        date: new Date(),
        manager: "User",
        managerNormalized: "USER",
        clientId: 1,
        clientName: "Client",
        serviceName: "Service",
        total: 100,
        suggestedUserId: null,
        recentManagerName: null,
      },
    ];
  }

  async countUnassignedByManagerName() {
    return 0;
  }

  async listBackfillLines() {
    return [];
  }
}

describe("listUnmatched", () => {
  it("delegates to repository", async () => {
    const repo = new InMemoryInvoiceRepository();
    const result = await listUnmatched({ repo });
    expect(result).toHaveLength(1);
  });
});

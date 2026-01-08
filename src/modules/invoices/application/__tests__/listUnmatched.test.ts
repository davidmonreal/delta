import { describe, expect, it } from "vitest";

import { listUnmatched } from "../listUnmatched";
import type { InvoiceRepository } from "../../ports/invoiceRepository";

class InMemoryInvoiceRepository implements InvoiceRepository {
  async listUnmatched() {
    return [
      {
        id: 1,
        date: new Date(),
        manager: "User",
        managerNormalized: "USER",
        clientName: "Client",
        serviceName: "Service",
        total: 100,
        suggestedUserId: null,
      },
    ];
  }

  async assignManager() {
    return;
  }

  async assignManagersForUser() {
    return 0;
  }

  async countUnassignedByManagerName() {
    return 0;
  }

  async backfillManagers(_: {
    userCandidates: { id: number; nameNormalized: string }[];
    onProgress?: (progress: { processed: number; total: number }) => Promise<void> | void;
  }) {
    return 0;
  }
}

describe("listUnmatched", () => {
  it("delegates to repository", async () => {
    const repo = new InMemoryInvoiceRepository();
    const result = await listUnmatched({ repo });
    expect(result).toHaveLength(1);
  });
});

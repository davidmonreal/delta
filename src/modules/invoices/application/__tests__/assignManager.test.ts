import { describe, expect, it } from "vitest";

import { assignManager } from "../assignManager";
import type { InvoiceRepository } from "../../ports/invoiceRepository";

class InMemoryInvoiceRepository implements InvoiceRepository {
  assigned: { lineId: number; userId: number } | null = null;

  async listUnmatched() {
    return [];
  }

  async assignManager(lineId: number, userId: number) {
    this.assigned = { lineId, userId };
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

describe("assignManager", () => {
  it("delegates to repository with ids", async () => {
    const repo = new InMemoryInvoiceRepository();
    await assignManager({ repo, lineId: 10, userId: 20 });

    expect(repo.assigned).toEqual({ lineId: 10, userId: 20 });
  });
});

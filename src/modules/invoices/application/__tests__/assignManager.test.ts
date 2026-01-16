import { describe, expect, it } from "vitest";

import { assignManager } from "../assignManager";
import type { InvoiceCommandRepository } from "../../ports/invoiceRepository";

class InMemoryInvoiceRepository implements InvoiceCommandRepository {
  assigned: { lineId: number; userId: number } | null = null;

  async assignManager(lineId: number, userId: number) {
    this.assigned = { lineId, userId };
  }

  async assignManagerForClient() {
    return 0;
  }

  async assignManagersForUser() {
    return 0;
  }

  async updateManagerAssignments() {
    return;
  }

  async updateManagerNormalized() {
    return;
  }

  async assignManagerAlias() {
    return;
  }
}

describe("assignManager", () => {
  it("delegates to repository with ids", async () => {
    const repo = new InMemoryInvoiceRepository();
    await assignManager({ repo, lineId: 10, userId: 20 });

    expect(repo.assigned).toEqual({ lineId: 10, userId: 20 });
  });
});

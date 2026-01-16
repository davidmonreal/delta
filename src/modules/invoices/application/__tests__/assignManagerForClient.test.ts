import { describe, expect, it } from "vitest";

import { assignManagerForClient } from "../assignManagerForClient";
import type { InvoiceCommandRepository } from "../../ports/invoiceRepository";

class InMemoryInvoiceRepository implements InvoiceCommandRepository {
  assigned: { clientId: number; userId: number } | null = null;

  async assignManager() {
    return;
  }

  async assignManagerForClient({ clientId, userId }: { clientId: number; userId: number }) {
    this.assigned = { clientId, userId };
    return 1;
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
}

describe("assignManagerForClient", () => {
  it("delegates to repository with ids", async () => {
    const repo = new InMemoryInvoiceRepository();

    await assignManagerForClient({ repo, clientId: 30, userId: 50 });

    expect(repo.assigned).toEqual({ clientId: 30, userId: 50 });
  });
});

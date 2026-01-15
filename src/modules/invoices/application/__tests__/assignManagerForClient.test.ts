import { describe, expect, it } from "vitest";

import { assignManagerForClient } from "../assignManagerForClient";
import type { InvoiceRepository } from "../../ports/invoiceRepository";

class InMemoryInvoiceRepository implements InvoiceRepository {
  assigned: { clientId: number; userId: number } | null = null;

  async listUnmatched() {
    return [];
  }

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

  async countUnassignedByManagerName() {
    return 0;
  }

  async backfillManagers() {
    return 0;
  }
}

describe("assignManagerForClient", () => {
  it("delegates to repository with ids", async () => {
    const repo = new InMemoryInvoiceRepository();

    await assignManagerForClient({ repo, clientId: 30, userId: 50 });

    expect(repo.assigned).toEqual({ clientId: 30, userId: 50 });
  });
});

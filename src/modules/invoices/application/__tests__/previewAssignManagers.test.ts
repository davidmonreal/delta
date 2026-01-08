import { describe, expect, it } from "vitest";

import { previewAssignManagers } from "../previewAssignManagers";
import type { InvoiceRepository } from "../../ports/invoiceRepository";

class InMemoryInvoiceRepository implements InvoiceRepository {
  async listUnmatched() {
    return [];
  }

  async assignManager() {
    return;
  }

  async assignManagersForUser() {
    return 0;
  }

  async countUnassignedByManagerName({ nameNormalized }: { nameNormalized: string }) {
    return nameNormalized === "TONI NAVARRETE" ? 5 : 0;
  }

  async backfillManagers(_: {
    userCandidates: { id: number; nameNormalized: string }[];
    onProgress?: (progress: { processed: number; total: number }) => Promise<void> | void;
  }) {
    return 0;
  }
}

describe("previewAssignManagers", () => {
  it("returns the number of unassigned lines for a normalized name", async () => {
    const repo = new InMemoryInvoiceRepository();
    const count = await previewAssignManagers({
      repo,
      nameNormalized: "TONI NAVARRETE",
    });
    expect(count).toBe(5);
  });
});

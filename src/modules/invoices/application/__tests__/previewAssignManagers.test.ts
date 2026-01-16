import { describe, expect, it } from "vitest";

import { previewAssignManagers } from "../previewAssignManagers";
import type { InvoiceQueryRepository } from "../../ports/invoiceRepository";

class InMemoryInvoiceRepository implements InvoiceQueryRepository {
  async listUnmatched() {
    return [];
  }

  async countUnassignedByManagerName({ nameNormalized }: { nameNormalized: string }) {
    return nameNormalized === "TONI NAVARRETE" ? 5 : 0;
  }

  async listBackfillLines() {
    return [];
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

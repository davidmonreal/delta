import { describe, expect, it } from "vitest";

import { backfillManagers } from "../backfillManagers";
import type {
  BackfillInvoiceLine,
  InvoiceRepository,
  ManagerAssignmentUpdate,
  ManagerNormalizationUpdate,
} from "../../ports/invoiceRepository";

class InMemoryInvoiceRepository implements InvoiceRepository {
  lines: BackfillInvoiceLine[] = [
    { id: 1, manager: "Alfa", managerNormalized: "ALFA", managerUserId: null },
    { id: 2, manager: "Beta", managerNormalized: null, managerUserId: null },
    { id: 3, manager: "Gamma", managerNormalized: null, managerUserId: 5 },
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

  async listBackfillLines() {
    return this.lines;
  }

  async listUnmatchedManagers() {
    return [];
  }

  async updateManagerAssignments({ updates }: { updates: ManagerAssignmentUpdate[] }) {
    for (const entry of updates) {
      for (const id of entry.ids) {
        const line = this.lines.find((item) => item.id === id);
        if (!line) continue;
        line.managerUserId = entry.managerUserId;
        line.managerNormalized = entry.managerNormalized;
      }
    }
  }

  async updateManagerNormalized({
    updates,
  }: {
    updates: ManagerNormalizationUpdate[];
  }) {
    for (const entry of updates) {
      for (const id of entry.ids) {
        const line = this.lines.find((item) => item.id === id);
        if (!line) continue;
        line.managerNormalized = entry.managerNormalized;
      }
    }
  }
}

describe("backfillManagers", () => {
  it("returns number of updated lines", async () => {
    const repo = new InMemoryInvoiceRepository();
    const userCandidates = [{ id: 1, nameNormalized: "ALFA" }];
    const updated = await backfillManagers({ repo, userCandidates });
    expect(updated).toBe(1);
    expect(repo.lines[1].managerNormalized).toBe("BETA");
    expect(repo.lines[2].managerNormalized).toBe("GAMMA");
  });
});

import { describe, expect, it } from "vitest";

import { getUnmatchedAssignments } from "../getUnmatchedAssignments";
import type { InvoiceRepository } from "../../ports/invoiceRepository";
import type { UserRepository } from "@/modules/users/ports/userRepository";

describe("getUnmatchedAssignments", () => {
  it("returns suggestions only when enabled", async () => {
    const invoiceRepo: InvoiceRepository = {
      async listUnmatched() {
        return [
          {
            id: 1,
            date: new Date(),
            manager: "Juani",
            managerNormalized: "JUANI",
            clientId: 1,
            clientName: "Client A",
            serviceName: "Service A",
            total: 10,
          },
        ];
      },
      async assignManager() {},
      async assignManagersForUser() {
        return 0;
      },
      async countUnassignedByManagerName() {
        return 0;
      },
      async backfillManagers() {
        return 0;
      },
    };

    const userRepo: UserRepository = {
      async listAll() {
        return [
          {
            id: 9,
            email: "juani@example.com",
            name: "Juani",
            nameNormalized: "JUANI",
            role: "USER",
            createdAt: new Date(),
            passwordHash: "hashed",
          },
        ];
      },
      async findByEmail() {
        return null;
      },
      async findById() {
        return null;
      },
      async create() {
        throw new Error("not needed");
      },
      async update() {
        throw new Error("not needed");
      },
      async delete() {
        throw new Error("not needed");
      },
      async list() {
        return [];
      },
    };

    const withoutSuggestions = await getUnmatchedAssignments({
      invoiceRepo,
      userRepo,
      suggestionsEnabled: false,
    });
    expect(withoutSuggestions.lines[0].suggestedUserId).toBeNull();

    const withSuggestions = await getUnmatchedAssignments({
      invoiceRepo,
      userRepo,
      suggestionsEnabled: true,
    });
    expect(withSuggestions.lines[0].suggestedUserId).toBe(9);
  });
});

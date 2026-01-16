import { describe, expect, it, vi } from "vitest";

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
      async countUnassignedByManagerName() {
        return 0;
      },
      async listBackfillLines() {
        return [];
      },
      async listUnmatchedManagers() {
        return [];
      },
      async assignManagerAlias() {
        return;
      },
      async assignManager() {
        throw new Error("not needed");
      },
      async assignManagerForClient() {
        throw new Error("not needed");
      },
      async assignManagersForUser() {
        throw new Error("not needed");
      },
      async updateManagerAssignments() {
        throw new Error("not needed");
      },
      async updateManagerNormalized() {
        throw new Error("not needed");
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
            updatedAt: new Date(),
            passwordHash: "hashed",
            managerAliases: [],
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
      async listManagerAliasOwners() {
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

  it("applies stored manager aliases before listing unmatched lines", async () => {
    const assignManagerAlias = vi.fn().mockResolvedValue(undefined);
    const listUnmatched = vi.fn().mockResolvedValue([]);
    const invoiceRepo: InvoiceRepository = {
      listUnmatched,
      assignManagerAlias,
      async countUnassignedByManagerName() {
        return 0;
      },
      async listBackfillLines() {
        return [];
      },
      async listUnmatchedManagers() {
        return [];
      },
      async assignManager() {
        throw new Error("not needed");
      },
      async assignManagerForClient() {
        throw new Error("not needed");
      },
      async assignManagersForUser() {
        throw new Error("not needed");
      },
      async updateManagerAssignments() {
        throw new Error("not needed");
      },
      async updateManagerNormalized() {
        throw new Error("not needed");
      },
    };

    const userRepo: UserRepository = {
      async listAll() {
        return [
          {
            id: 1,
            email: "alias@example.com",
            name: "Alias Owner",
            nameNormalized: "ALIAS OWNER",
            role: "USER",
            createdAt: new Date(),
            updatedAt: new Date(),
            passwordHash: "hashed",
            managerAliases: [{ alias: "Certificats Digitals" }],
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
      async listManagerAliasOwners() {
        return [];
      },
    };

    await getUnmatchedAssignments({
      invoiceRepo,
      userRepo,
      suggestionsEnabled: false,
    });

    expect(assignManagerAlias).toHaveBeenCalledWith("Certificats Digitals", 1);
    expect(listUnmatched).toHaveBeenCalled();
  });
});

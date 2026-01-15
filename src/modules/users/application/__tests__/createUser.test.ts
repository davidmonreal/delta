import { describe, expect, it } from "vitest";

import { createUser } from "../createUser";
import type { CreateUserInput } from "../../dto/userSchemas";
import { InMemoryUserRepository, StubPasswordHasher } from "./testUtils";
import type { InvoiceRepository } from "@/modules/invoices/ports/invoiceRepository";

const baseInput: CreateUserInput = {
  email: "user@example.com",
  name: "  Jane Doe  ",
  password: "secret",
  role: "USER",
};

describe("createUser", () => {
  it("blocks admins from creating superadmins", async () => {
    const repo = new InMemoryUserRepository();
    const invoiceRepo: InvoiceRepository = {
      listUnmatched: async () => [],
      assignManager: async () => undefined,
      assignManagerForClient: async () => 0,
      assignManagersForUser: async () => 0,
      countUnassignedByManagerName: async () => 0,
      backfillManagers: async () => 0,
    };
    const result = await createUser({
      input: { ...baseInput, role: "SUPERADMIN" },
      sessionUser: { id: "1", role: "ADMIN" },
      repo,
      passwordHasher: new StubPasswordHasher(),
      invoiceRepo,
    });

    expect(result.error).toBe("No tens permisos per crear superadmins.");
  });

  it("rejects duplicate emails", async () => {
    const repo = new InMemoryUserRepository([
      {
        id: 1,
        email: "user@example.com",
        name: "Existing",
        nameNormalized: "EXISTING",
        role: "USER",
        passwordHash: "hashed:old",
        createdAt: new Date(),
      },
    ]);
    const invoiceRepo: InvoiceRepository = {
      listUnmatched: async () => [],
      assignManager: async () => undefined,
      assignManagerForClient: async () => 0,
      assignManagersForUser: async () => 0,
      countUnassignedByManagerName: async () => 0,
      backfillManagers: async () => 0,
    };
    const result = await createUser({
      input: baseInput,
      sessionUser: { id: "1", role: "SUPERADMIN" },
      repo,
      passwordHasher: new StubPasswordHasher(),
      invoiceRepo,
    });

    expect(result.error).toBe("Aquest email ja existeix.");
  });

  it("creates a user with hashed password", async () => {
    const repo = new InMemoryUserRepository();
    const invoiceRepo: InvoiceRepository = {
      listUnmatched: async () => [],
      assignManager: async () => undefined,
      assignManagerForClient: async () => 0,
      assignManagersForUser: async () => 2,
      countUnassignedByManagerName: async () => 0,
      backfillManagers: async () => 0,
    };
    const result = await createUser({
      input: baseInput,
      sessionUser: { id: "1", role: "SUPERADMIN" },
      repo,
      passwordHasher: new StubPasswordHasher(),
      invoiceRepo,
    });

    expect(result.success).toBe("Usuari creat correctament. 2 línies assignades.");
    const created = await repo.findByEmail("user@example.com");
    expect(created?.passwordHash).toBe("hashed:secret");
    expect(created?.name).toBe("Jane Doe");
    expect(created?.nameNormalized).toBe("JANE DOE");
  });
});

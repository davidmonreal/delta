import { describe, expect, it } from "vitest";

import { updateUser } from "../updateUser";
import type { UpdateUserInput } from "../../dto/userSchemas";
import { InMemoryUserRepository, StubPasswordHasher } from "./testUtils";

const baseUser = {
  id: 1,
  email: "user@example.com",
  name: "User",
  role: "USER" as const,
  passwordHash: "hashed:old",
  createdAt: new Date(),
};

const baseInput: UpdateUserInput = {
  userId: 1,
  email: "user@example.com",
  name: "User",
  role: "USER",
};

describe("updateUser", () => {
  it("blocks admins from editing superadmins", async () => {
    const repo = new InMemoryUserRepository([
      { ...baseUser, role: "SUPERADMIN" },
    ]);
    const result = await updateUser({
      input: { ...baseInput, role: "SUPERADMIN" },
      sessionUser: { id: "2", role: "ADMIN" },
      repo,
      passwordHasher: new StubPasswordHasher(),
    });

    expect(result.error).toBe("No tens permisos per editar superadmins.");
  });

  it("blocks admins from assigning superadmin", async () => {
    const repo = new InMemoryUserRepository([baseUser]);
    const result = await updateUser({
      input: { ...baseInput, role: "SUPERADMIN" },
      sessionUser: { id: "2", role: "ADMIN" },
      repo,
      passwordHasher: new StubPasswordHasher(),
    });

    expect(result.error).toBe("No tens permisos per assignar superadmin.");
  });

  it("rejects duplicate email updates", async () => {
    const repo = new InMemoryUserRepository([
      baseUser,
      {
        id: 2,
        email: "other@example.com",
        name: "Other",
        role: "USER",
        passwordHash: "hashed:other",
        createdAt: new Date(),
      },
    ]);
    const result = await updateUser({
      input: { ...baseInput, email: "other@example.com" },
      sessionUser: { id: "2", role: "SUPERADMIN" },
      repo,
      passwordHasher: new StubPasswordHasher(),
    });

    expect(result.error).toBe("Aquest email ja existeix.");
  });

  it("updates password when provided", async () => {
    const repo = new InMemoryUserRepository([baseUser]);
    const result = await updateUser({
      input: { ...baseInput, password: "newpass" },
      sessionUser: { id: "2", role: "SUPERADMIN" },
      repo,
      passwordHasher: new StubPasswordHasher(),
    });

    expect(result.success).toBe("Usuari actualitzat correctament.");
    const updated = await repo.findById(1);
    expect(updated?.passwordHash).toBe("hashed:newpass");
  });
});

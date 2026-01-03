import { describe, expect, it } from "vitest";

import { deleteUser } from "../deleteUser";
import type { UserEntity } from "../../domain/user";
import { InMemoryUserRepository } from "./testUtils";

const baseUser: UserEntity = {
  id: 1,
  email: "user@example.com",
  name: "User",
  nameNormalized: "USER",
  role: "USER",
  passwordHash: "hashed",
  createdAt: new Date(),
};

const buildUser = (overrides: Partial<UserEntity>): UserEntity => ({
  ...baseUser,
  ...overrides,
});

describe("deleteUser", () => {
  it("returns error when user is missing", async () => {
    const repo = new InMemoryUserRepository();

    const result = await deleteUser({
      userId: 1,
      sessionUser: { id: "2", role: "ADMIN" },
      repo,
    });

    expect(result.error).toBe("Usuari no trobat.");
  });

  it("blocks normal users from deleting", async () => {
    const repo = new InMemoryUserRepository([baseUser]);

    const result = await deleteUser({
      userId: 1,
      sessionUser: { id: "2", role: "USER" },
      repo,
    });

    expect(result.error).toBe("No tens permisos per esborrar usuaris.");
  });

  it("blocks deleting yourself", async () => {
    const repo = new InMemoryUserRepository([
      buildUser({ id: 10, role: "ADMIN", email: "admin@example.com" }),
    ]);

    const result = await deleteUser({
      userId: 10,
      sessionUser: { id: "10", role: "ADMIN" },
      repo,
    });

    expect(result.error).toBe("No pots esborrar-te a tu mateix.");
  });

  it("blocks admins from deleting superadmins", async () => {
    const repo = new InMemoryUserRepository([
      buildUser({ id: 2, role: "SUPERADMIN", email: "super@example.com" }),
    ]);

    const result = await deleteUser({
      userId: 2,
      sessionUser: { id: "10", role: "ADMIN" },
      repo,
    });

    expect(result.error).toBe("No tens permisos per esborrar superadmins.");
  });

  it("allows admins to delete users", async () => {
    const repo = new InMemoryUserRepository([baseUser]);

    const result = await deleteUser({
      userId: 1,
      sessionUser: { id: "10", role: "ADMIN" },
      repo,
    });

    expect(result.success).toBe("Usuari esborrat correctament.");
    expect(await repo.findById(1)).toBeNull();
  });

  it("allows superadmins to delete admins", async () => {
    const repo = new InMemoryUserRepository([
      buildUser({ id: 3, role: "ADMIN", email: "admin@example.com" }),
    ]);

    const result = await deleteUser({
      userId: 3,
      sessionUser: { id: "99", role: "SUPERADMIN" },
      repo,
    });

    expect(result.success).toBe("Usuari esborrat correctament.");
    expect(await repo.findById(3)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import { listUsers } from "../listUsers";
import { InMemoryUserRepository } from "./testUtils";

const seed = [
  {
    id: 1,
    email: "super@example.com",
    name: "Super",
    nameNormalized: "SUPER",
    role: "SUPERADMIN" as const,
    passwordHash: "hashed:one",
    createdAt: new Date(),
  },
  {
    id: 2,
    email: "admin@example.com",
    name: "Admin",
    nameNormalized: "ADMIN",
    role: "ADMIN" as const,
    passwordHash: "hashed:two",
    createdAt: new Date(),
  },
  {
    id: 3,
    email: "user@example.com",
    name: "User",
    nameNormalized: "USER",
    role: "USER" as const,
    passwordHash: "hashed:three",
    createdAt: new Date(),
  },
];

describe("listUsers", () => {
  it("returns all roles for superadmin", async () => {
    const repo = new InMemoryUserRepository(seed);
    const result = await listUsers({
      query: "",
      sessionUser: { id: "1", role: "SUPERADMIN" },
      repo,
    });

    expect(result.allowSuperadmin).toBe(true);
    expect(result.users).toHaveLength(3);
  });

  it("filters roles for admin", async () => {
    const repo = new InMemoryUserRepository(seed);
    const result = await listUsers({
      query: "",
      sessionUser: { id: "2", role: "ADMIN" },
      repo,
    });

    expect(result.allowSuperadmin).toBe(false);
    expect(result.users.map((user) => user.role)).toEqual(["ADMIN", "USER"]);
  });

  it("filters by query only when long enough", async () => {
    const repo = new InMemoryUserRepository(seed);
    const shortResult = await listUsers({
      query: "ad",
      sessionUser: { id: "2", role: "ADMIN" },
      repo,
    });
    const longResult = await listUsers({
      query: "adm",
      sessionUser: { id: "2", role: "ADMIN" },
      repo,
    });

    expect(shortResult.users).toHaveLength(2);
    expect(longResult.users).toHaveLength(1);
  });
});

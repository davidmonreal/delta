import { describe, expect, it } from "vitest";

import { authenticateUser } from "../authenticateUser";
import { InMemoryUserRepository, StubPasswordHasher } from "./testUtils";

const baseUser = {
  id: 1,
  email: "user@example.com",
  name: "User",
  role: "USER" as const,
  passwordHash: "hashed:secret",
  createdAt: new Date(),
};

describe("authenticateUser", () => {
  it("returns null for invalid credentials", async () => {
    const repo = new InMemoryUserRepository([baseUser]);
    const hasher = new StubPasswordHasher();

    const result = await authenticateUser({
      input: { email: "user@example.com", password: "bad" },
      repo,
      passwordHasher: hasher,
    });

    expect(result).toBeNull();
  });

  it("returns user data for valid credentials", async () => {
    const repo = new InMemoryUserRepository([baseUser]);
    const hasher = new StubPasswordHasher();

    const result = await authenticateUser({
      input: { email: "user@example.com", password: "secret" },
      repo,
      passwordHasher: hasher,
    });

    expect(result).toEqual({
      id: "1",
      email: "user@example.com",
      name: "User",
      role: "USER",
    });
  });
});

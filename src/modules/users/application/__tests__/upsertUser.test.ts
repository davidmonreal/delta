import { describe, expect, it } from "vitest";

import { upsertUser } from "../upsertUser";
import { InMemoryUserRepository, StubPasswordHasher } from "./testUtils";

const baseInput = {
  email: "user@example.com",
  name: "User",
  password: "secret",
  role: "USER" as const,
};

describe("upsertUser", () => {
  it("creates user when email is new", async () => {
    const repo = new InMemoryUserRepository();
    const result = await upsertUser({
      input: baseInput,
      repo,
      passwordHasher: new StubPasswordHasher(),
    });

    expect(result.created).toBe(true);
    const created = await repo.findByEmail(baseInput.email);
    expect(created?.passwordHash).toBe("hashed:secret");
    expect(created?.nameNormalized).toBe("USER");
  });

  it("updates user when email exists", async () => {
    const repo = new InMemoryUserRepository([
      {
        id: 1,
        email: baseInput.email,
        name: "Old",
        nameNormalized: "OLD",
        role: "ADMIN",
        passwordHash: "hashed:old",
        createdAt: new Date(),
      },
    ]);
    const result = await upsertUser({
      input: { ...baseInput, name: "New", role: "USER" },
      repo,
      passwordHasher: new StubPasswordHasher(),
    });

    expect(result.created).toBe(false);
    const updated = await repo.findByEmail(baseInput.email);
    expect(updated?.name).toBe("New");
    expect(updated?.role).toBe("USER");
    expect(updated?.passwordHash).toBe("hashed:secret");
    expect(updated?.nameNormalized).toBe("NEW");
  });
});

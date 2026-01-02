import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { PrismaUserRepository } from "../prismaUserRepository";

const describeDb = process.env.POSTGRES_PRISMA_URL ? describe : describe.skip;

describeDb("PrismaUserRepository", () => {
  it("creates and updates a user", async () => {
    const repo = new PrismaUserRepository();
    const email = `test-${Date.now()}@example.com`;

    try {
      const created = await repo.create({
        email,
        name: "Repo Test",
        role: "USER",
        passwordHash: "hashed",
      });

      expect(created.email).toBe(email);

      const updated = await repo.update(created.id, {
        email,
        name: "Repo Updated",
        role: "ADMIN",
        passwordHash: "hashed2",
      });

      expect(updated.name).toBe("Repo Updated");
      expect(updated.role).toBe("ADMIN");
    } finally {
      await prisma.user.deleteMany({ where: { email } });
      await repo.disconnect?.();
    }
  });
});

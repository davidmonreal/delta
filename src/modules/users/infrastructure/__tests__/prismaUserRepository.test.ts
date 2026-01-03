import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { PrismaUserRepository } from "../prismaUserRepository";

const describeDb =
  process.env.POSTGRES_PRISMA_URL && process.env.RUN_DB_TESTS === "1"
    ? describe
    : describe.skip;

describeDb("PrismaUserRepository", () => {
  it("creates, updates, and deletes a user", async () => {
    const repo = new PrismaUserRepository();
    const email = `test-${Date.now()}@example.com`;

    try {
      const created = await repo.create({
        email,
        name: "Repo Test",
        nameNormalized: "REPO TEST",
        role: "USER",
        passwordHash: "hashed",
      });

      expect(created.email).toBe(email);

      const updated = await repo.update(created.id, {
        email,
        name: "Repo Updated",
        nameNormalized: "REPO UPDATED",
        role: "ADMIN",
        passwordHash: "hashed2",
      });

      expect(updated.name).toBe("Repo Updated");
      expect(updated.role).toBe("ADMIN");

      const deleted = await repo.delete(created.id);
      expect(deleted.id).toBe(created.id);
      const missing = await repo.findById(created.id);
      expect(missing).toBeNull();
    } finally {
      await prisma.user.deleteMany({ where: { email } });
      await repo.disconnect?.();
    }
  });
});

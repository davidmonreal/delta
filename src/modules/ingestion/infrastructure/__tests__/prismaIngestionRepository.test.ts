import { afterEach, describe, expect, it } from "vitest";

import { PrismaIngestionRepository } from "../prismaIngestionRepository";
import { cleanupPrismaTestData } from "@/lib/prismaTestCleanup";

const describeDb =
  process.env.POSTGRES_PRISMA_URL && process.env.RUN_DB_TESTS === "1"
    ? describe
    : describe.skip;

describeDb("PrismaIngestionRepository", () => {
  afterEach(async () => {
    await cleanupPrismaTestData();
  });

  it("handles empty operations", async () => {
    const repo = new PrismaIngestionRepository();
    try {
      const created = await repo.createInvoiceLines([]);
      await repo.deleteInvoiceLinesBySourceFile("__test__");

      expect(created).toBe(0);
    } finally {
      await cleanupPrismaTestData();
      await repo.disconnect?.();
    }
  });
});

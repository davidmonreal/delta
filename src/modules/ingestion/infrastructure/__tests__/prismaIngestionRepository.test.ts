import { describe, expect, it } from "vitest";

import { PrismaIngestionRepository } from "../prismaIngestionRepository";

const describeDb =
  process.env.POSTGRES_PRISMA_URL && process.env.RUN_DB_TESTS === "1"
    ? describe
    : describe.skip;

describeDb("PrismaIngestionRepository", () => {
  it("handles empty operations", async () => {
    const repo = new PrismaIngestionRepository();

    const created = await repo.createInvoiceLines([]);
    await repo.deleteInvoiceLinesBySourceFile("__test__");

    expect(created).toBe(0);
    await repo.disconnect?.();
  });
});

import { afterEach, describe, expect, it } from "vitest";

import { PrismaReportingRepository } from "../prismaReportingRepository";
import { cleanupPrismaTestData } from "@/lib/prismaTestCleanup";

const describeDb =
  process.env.POSTGRES_PRISMA_URL && process.env.RUN_DB_TESTS === "1"
    ? describe
    : describe.skip;

describeDb("PrismaReportingRepository", () => {
  afterEach(async () => {
    await cleanupPrismaTestData();
  });

  it("returns defaults without errors", async () => {
    const repo = new PrismaReportingRepository();
    try {
      const latest = await repo.getLatestEntry();
      const emptyClients = await repo.getClientsByIds([]);
      const emptyServices = await repo.getServicesByIds([]);

      expect(Array.isArray(emptyClients)).toBe(true);
      expect(Array.isArray(emptyServices)).toBe(true);
      expect(latest === null || (latest.year > 0 && latest.month > 0)).toBe(true);
    } finally {
      await cleanupPrismaTestData();
    }
  });
});

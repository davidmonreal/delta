import { describe, expect, it } from "vitest";

import { PrismaReportingRepository } from "../prismaReportingRepository";

const describeDb = process.env.POSTGRES_PRISMA_URL ? describe : describe.skip;

describeDb("PrismaReportingRepository", () => {
  it("returns defaults without errors", async () => {
    const repo = new PrismaReportingRepository();

    const latest = await repo.getLatestEntry();
    const emptyClients = await repo.getClientsByIds([]);
    const emptyServices = await repo.getServicesByIds([]);

    expect(Array.isArray(emptyClients)).toBe(true);
    expect(Array.isArray(emptyServices)).toBe(true);
    expect(latest === null || (latest.year > 0 && latest.month > 0)).toBe(true);
  });
});

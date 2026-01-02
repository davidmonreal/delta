import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { normalizeName } from "@/lib/normalize";
import { PrismaInvoiceRepository } from "../prismaInvoiceRepository";

const describeDb =
  process.env.POSTGRES_PRISMA_URL && process.env.RUN_DB_TESTS === "1"
    ? describe
    : describe.skip;

describeDb("PrismaInvoiceRepository", () => {
  it("counts and assigns unassigned manager lines", async () => {
    const repo = new PrismaInvoiceRepository();
    const runId = Date.now();
    const manager = `Toni Navarrete ${runId}`;
    const managerNormalized = normalizeName(manager);
    const sourceFile = `__test__${runId}`;
    const email = `test-${runId}@example.com`;
    const clientName = `Client ${runId}`;
    const serviceName = `Service ${runId}`;

    const client = await prisma.client.create({
      data: {
        nameRaw: clientName,
        nameNormalized: normalizeName(clientName),
      },
    });
    const service = await prisma.service.create({
      data: {
        conceptRaw: serviceName,
        conceptNormalized: normalizeName(serviceName),
      },
    });

    try {
      await prisma.invoiceLine.createMany({
        data: [
          {
            date: new Date(),
            year: 2025,
            month: 1,
            units: 1,
            price: 100,
            total: 100,
            manager,
            managerNormalized,
            sourceFile,
            clientId: client.id,
            serviceId: service.id,
          },
          {
            date: new Date(),
            year: 2025,
            month: 1,
            units: 2,
            price: 150,
            total: 300,
            manager,
            managerNormalized,
            sourceFile,
            clientId: client.id,
            serviceId: service.id,
          },
        ],
      });

      const before = await repo.countUnassignedByManagerName({
        nameNormalized: managerNormalized,
      });
      expect(before).toBe(2);

      const user = await prisma.user.create({
        data: {
          email,
          name: manager,
          nameNormalized: managerNormalized,
          role: "USER",
          passwordHash: "hashed",
        },
      });

      const assigned = await repo.assignManagersForUser({
        userId: user.id,
        nameNormalized: managerNormalized,
      });
      expect(assigned).toBe(2);

      const after = await repo.countUnassignedByManagerName({
        nameNormalized: managerNormalized,
      });
      expect(after).toBe(0);
    } finally {
      await prisma.invoiceLine.deleteMany({ where: { sourceFile } });
      await prisma.user.deleteMany({ where: { email } });
      await prisma.client.deleteMany({ where: { id: client.id } });
      await prisma.service.deleteMany({ where: { id: service.id } });
      await repo.disconnect?.();
    }
  });
});

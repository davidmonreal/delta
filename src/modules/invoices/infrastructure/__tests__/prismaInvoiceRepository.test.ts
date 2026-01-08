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

  it("lists unmatched lines with suggested manager", async () => {
    const repo = new PrismaInvoiceRepository();
    const runId = Date.now();
    const sourceFile = `__test__list__${runId}`;
    const clientName = `Client ${runId}`;
    const serviceName = `Service ${runId}`;
    const email = `test-list-${runId}@example.com`;

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
    const user = await prisma.user.create({
      data: {
        email,
        name: "Assigned Manager",
        nameNormalized: "ASSIGNED MANAGER",
        role: "USER",
        passwordHash: "hashed",
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
            manager: "Unmatched Manager",
            managerNormalized: "UNMATCHED MANAGER",
            sourceFile,
            clientId: client.id,
            serviceId: service.id,
          },
          {
            date: new Date(),
            year: 2025,
            month: 1,
            units: 1,
            price: 100,
            total: 100,
            manager: "Assigned Manager",
            managerNormalized: "ASSIGNED MANAGER",
            sourceFile,
            clientId: client.id,
            serviceId: service.id,
            managerUserId: user.id,
          },
        ],
      });

      const result = await repo.listUnmatched();
      const line = result.find((entry) => entry.manager === "Unmatched Manager");
      expect(line?.clientName).toBe(clientName);
      expect(line?.serviceName).toBe(serviceName);
      expect(line?.suggestedUserId).toBe(user.id);
    } finally {
      await prisma.invoiceLine.deleteMany({ where: { sourceFile } });
      await prisma.user.deleteMany({ where: { id: user.id } });
      await prisma.client.deleteMany({ where: { id: client.id } });
      await prisma.service.deleteMany({ where: { id: service.id } });
      await repo.disconnect?.();
    }
  });

  it("prefers manager match over client suggestion", async () => {
    const repo = new PrismaInvoiceRepository();
    const runId = Date.now();
    const sourceFile = `__test__match__${runId}`;
    const clientName = `Client ${runId}`;
    const serviceName = `Service ${runId}`;
    const assignedEmail = `test-assigned-${runId}@example.com`;
    const matchEmail = `test-match-${runId}@example.com`;

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
    const assignedUser = await prisma.user.create({
      data: {
        email: assignedEmail,
        name: "Vanesa Lopez",
        nameNormalized: normalizeName("Vanesa Lopez"),
        role: "USER",
        passwordHash: "hashed",
      },
    });
    const matchUser = await prisma.user.create({
      data: {
        email: matchEmail,
        name: "Maite Villagrasa",
        nameNormalized: normalizeName("Maite Villagrasa"),
        role: "USER",
        passwordHash: "hashed",
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
            manager: "Maite Villagrasa",
            managerNormalized: normalizeName("Maite Villagrasa"),
            sourceFile,
            clientId: client.id,
            serviceId: service.id,
          },
          {
            date: new Date(),
            year: 2025,
            month: 1,
            units: 1,
            price: 100,
            total: 100,
            manager: "Assigned Manager",
            managerNormalized: normalizeName("Assigned Manager"),
            sourceFile,
            clientId: client.id,
            serviceId: service.id,
            managerUserId: assignedUser.id,
          },
        ],
      });

      const result = await repo.listUnmatched();
      const line = result.find((entry) => entry.manager === "Maite Villagrasa");
      expect(line?.suggestedUserId).toBe(matchUser.id);
    } finally {
      await prisma.invoiceLine.deleteMany({ where: { sourceFile } });
      await prisma.user.deleteMany({ where: { id: { in: [assignedUser.id, matchUser.id] } } });
      await prisma.client.deleteMany({ where: { id: client.id } });
      await prisma.service.deleteMany({ where: { id: service.id } });
      await repo.disconnect?.();
    }
  });
});

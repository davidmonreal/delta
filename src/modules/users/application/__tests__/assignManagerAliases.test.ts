import { afterEach, describe, it, expect } from "vitest";

import { prisma } from "@/lib/db";
import { cleanupPrismaTestData } from "@/lib/prismaTestCleanup";
import { PrismaInvoiceRepository } from "@/modules/invoices/infrastructure/prismaInvoiceRepository";
import { PrismaUserRepository } from "@/modules/users/infrastructure/prismaUserRepository";
import { updateUser } from "@/modules/users/application/updateUser";
import { BcryptPasswordHasher } from "@/modules/users/infrastructure/bcryptPasswordHasher";

const describeDb =
  process.env.POSTGRES_PRISMA_URL && process.env.RUN_DB_TESTS === "1"
    ? describe
    : describe.skip;

describeDb("Manager Alias Assignment Integration", () => {
  const invoiceRepo = new PrismaInvoiceRepository();
  const userRepo = new PrismaUserRepository();
  const passwordHasher = new BcryptPasswordHasher();

  afterEach(async () => {
    await cleanupPrismaTestData();
  });

  it("should assign unmatched invoice lines when a manager alias is assigned to a user", async () => {
    const runId = Date.now();
    const client = await prisma.client.create({
      data: { nameRaw: `Client ${runId}`, nameNormalized: `CLIENT ${runId}` },
    });
    const service = await prisma.service.create({
      data: { conceptRaw: `Service ${runId}`, conceptNormalized: `SERVICE ${runId}` },
    });

    const managerName = "Gestor Oblit";

    await prisma.invoiceLine.create({
      data: {
        date: new Date(),
        year: 2024,
        month: 1,
        units: 1,
        price: 100,
        total: 100,
        sourceFile: `__test__alias-${runId}`,
        manager: managerName,
        managerNormalized: null,
        clientId: client.id,
        serviceId: service.id,
        managerUserId: null,
      },
    });

    const user = await userRepo.create({
      email: `test-alias-${runId}@example.com`,
      role: "USER",
      name: "Gestor Nou",
      nameNormalized: "GESTOR NOU",
      passwordHash: "hashed_password",
    });

    await updateUser({
      input: {
        userId: user.id,
        email: user.email,
        role: "USER",
        managerAliases: [managerName],
      },
      sessionUser: { id: String(user.id), role: "SUPERADMIN" },
      repo: userRepo,
      passwordHasher,
      invoiceRepo,
    });

    const lines = await prisma.invoiceLine.findMany({
      where: { managerUserId: user.id },
    });

    expect(lines).toHaveLength(1);
    expect(lines[0].manager).toBe(managerName);

    const updatedUser = await userRepo.findById(user.id);
    expect(updatedUser?.managerAliases).toHaveLength(1);
    expect(updatedUser?.managerAliases?.[0].alias).toBe("GESTOR OBLIT");
  });
});

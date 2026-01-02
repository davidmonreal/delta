import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { normalizeName } from "@/lib/normalize";
import { PrismaCommentRepository } from "../prismaCommentRepository";

const describeDb =
  process.env.POSTGRES_PRISMA_URL && process.env.RUN_DB_TESTS === "1"
    ? describe
    : describe.skip;

describeDb("PrismaCommentRepository", () => {
  it("creates a comparison comment", async () => {
    const repo = new PrismaCommentRepository();
    const runId = Date.now();
    const email = `test-comment-${runId}@example.com`;
    const clientName = `Client ${runId}`;
    const serviceName = `Service ${runId}`;

    const user = await prisma.user.create({
      data: {
        email,
        name: "Test User",
        nameNormalized: "TEST USER",
        role: "USER",
        passwordHash: "hashed",
      },
    });
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
      await repo.createComparisonComment({
        userId: user.id,
        clientId: client.id,
        serviceId: service.id,
        year: 2025,
        month: 1,
        kind: "REPORT_ERROR",
        message: "Aquest import no coincideix.",
      });

      const count = await prisma.comparisonComment.count({
        where: {
          userId: user.id,
          clientId: client.id,
          serviceId: service.id,
        },
      });
      expect(count).toBe(1);
    } finally {
      await prisma.comparisonComment.deleteMany({
        where: { userId: user.id },
      });
      await prisma.user.deleteMany({ where: { id: user.id } });
      await prisma.client.deleteMany({ where: { id: client.id } });
      await prisma.service.deleteMany({ where: { id: service.id } });
      await repo.disconnect?.();
    }
  });
});

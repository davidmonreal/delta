import { prisma } from "@/lib/db";
import { normalizeName } from "@/lib/normalize";
import { Prisma } from "@/generated/prisma";

import type {
  BackfillInvoiceLine,
  InvoiceRepository,
  ManagerAssignmentUpdate,
  ManagerNormalizationUpdate,
  UnmatchedInvoiceLine,
} from "../ports/invoiceRepository";

function toNumber(value: Prisma.Decimal | number) {
  return typeof value === "number" ? value : value.toNumber();
}

export class PrismaInvoiceRepository implements InvoiceRepository {
  async listUnmatched(): Promise<UnmatchedInvoiceLine[]> {
    const lines = await prisma.invoiceLine.findMany({
      where: { managerUserId: null },
      orderBy: [{ date: "desc" }],
      select: {
        id: true,
        date: true,
        manager: true,
        managerNormalized: true,
        total: true,
        clientId: true,
        client: { select: { nameRaw: true } },
        service: { select: { conceptRaw: true } },
      },
    });

    const clientIds = Array.from(new Set(lines.map((line) => line.clientId)));
    const suggested = clientIds.length
      ? await prisma.invoiceLine.findMany({
        where: {
          clientId: { in: clientIds },
          managerUserId: { not: null },
        },
        orderBy: [{ date: "desc" }],
        distinct: ["clientId"],
        select: { clientId: true, managerUserId: true },
      })
      : [];
    const suggestedByClient = new Map(
      suggested.map((row) => [row.clientId, row.managerUserId]),
    );
    const recentManagers = clientIds.length
      ? await prisma.invoiceLine.findMany({
        where: { clientId: { in: clientIds } },
        orderBy: [{ date: "desc" }],
        distinct: ["clientId"],
        select: { clientId: true, manager: true },
      })
      : [];
    const recentManagerByClient = new Map(
      recentManagers.map((row) => [row.clientId, row.manager]),
    );

    const mapped = lines.map((line) => ({
      id: line.id,
      date: line.date,
      manager: line.manager,
      managerNormalized: line.managerNormalized,
      clientId: line.clientId,
      clientName: line.client.nameRaw,
      serviceName: line.service.conceptRaw,
      total: toNumber(line.total),
      suggestedUserId: suggestedByClient.get(line.clientId) ?? null,
      recentManagerName: recentManagerByClient.get(line.clientId) ?? null,
    }));

    return mapped.sort((a, b) => {
      const aEmpty = a.manager.trim().length === 0;
      const bEmpty = b.manager.trim().length === 0;
      if (aEmpty !== bEmpty) return aEmpty ? -1 : 1;
      return b.date.getTime() - a.date.getTime();
    });
  }

  async listUnmatchedManagers(query: string): Promise<string[]> {
    const result = await prisma.invoiceLine.findMany({
      where: {
        managerUserId: null,
        manager: { contains: query, mode: "insensitive" },
      },
      select: { manager: true },
      distinct: ["manager"],
      take: 20,
    });
    return result.map((row) => row.manager);
  }

  async assignManagerAlias(alias: string, userId: number): Promise<void> {
    const normalized = normalizeName(alias);
    await prisma.invoiceLine.updateMany({
      where: {
        managerUserId: null,
        managerNormalized: normalized,
      },
      data: {
        managerUserId: userId,
        managerNormalized: normalized,
      },
    });

    const needsNormalization = await prisma.invoiceLine.findMany({
      where: {
        managerUserId: null,
        managerNormalized: null,
      },
      select: { id: true, manager: true },
    });

    const idsToAssign = needsNormalization
      .filter((line) => normalizeName(line.manager) === normalized)
      .map((line) => line.id);
    if (idsToAssign.length) {
      await prisma.invoiceLine.updateMany({
        where: { id: { in: idsToAssign } },
        data: {
          managerUserId: userId,
          managerNormalized: normalized,
        },
      });
    }
  }

  async assignManager(lineId: number, userId: number) {
    await prisma.invoiceLine.update({
      where: { id: lineId },
      data: { managerUserId: userId },
    });
  }

  async assignManagerForClient({
    clientId,
    userId,
  }: {
    clientId: number;
    userId: number;
  }) {
    const result = await prisma.invoiceLine.updateMany({
      where: { clientId, managerUserId: null },
      data: { managerUserId: userId },
    });

    return result.count;
  }

  async assignManagersForUser({
    userId,
    nameNormalized,
  }: {
    userId: number;
    nameNormalized: string;
  }) {
    const direct = await prisma.invoiceLine.updateMany({
      where: {
        managerUserId: null,
        managerNormalized: nameNormalized,
      },
      data: { managerUserId: userId },
    });

    const needsNormalization = await prisma.invoiceLine.findMany({
      where: {
        managerUserId: null,
        managerNormalized: null,
      },
      select: { id: true, manager: true },
    });

    const idsToNormalize = needsNormalization
      .filter((line) => normalizeName(line.manager) === nameNormalized)
      .map((line) => line.id);
    if (idsToNormalize.length) {
      await prisma.invoiceLine.updateMany({
        where: { id: { in: idsToNormalize } },
        data: { managerUserId: userId, managerNormalized: nameNormalized },
      });
    }

    const updated = direct.count + idsToNormalize.length;

    return updated;
  }

  async countUnassignedByManagerName({
    nameNormalized,
  }: {
    nameNormalized: string;
  }) {
    return prisma.invoiceLine.count({
      where: {
        managerUserId: null,
        managerNormalized: nameNormalized,
      },
    });
  }

  async listBackfillLines(): Promise<BackfillInvoiceLine[]> {
    return prisma.invoiceLine.findMany({
      where: {
        OR: [{ managerUserId: null }, { managerNormalized: null }],
      },
      select: { id: true, manager: true, managerNormalized: true, managerUserId: true },
    });
  }

  async updateManagerAssignments({
    updates,
  }: {
    updates: ManagerAssignmentUpdate[];
  }): Promise<void> {
    for (const entry of updates) {
      await prisma.invoiceLine.updateMany({
        where: { id: { in: entry.ids } },
        data: {
          managerUserId: entry.managerUserId,
          managerNormalized: entry.managerNormalized,
        },
      });
    }
  }

  async updateManagerNormalized({
    updates,
  }: {
    updates: ManagerNormalizationUpdate[];
  }): Promise<void> {
    for (const entry of updates) {
      await prisma.invoiceLine.updateMany({
        where: { id: { in: entry.ids } },
        data: { managerNormalized: entry.managerNormalized },
      });
    }
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}

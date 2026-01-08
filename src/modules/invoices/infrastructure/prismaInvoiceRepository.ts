import { prisma } from "@/lib/db";
import { normalizeName } from "@/lib/normalize";
import { matchUserId } from "@/lib/match-user";

import type {
  BackfillProgress,
  InvoiceRepository,
  UnmatchedInvoiceLine,
} from "../ports/invoiceRepository";

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

    const mapped = lines.map((line) => ({
      id: line.id,
      date: line.date,
      manager: line.manager,
      managerNormalized: line.managerNormalized,
      clientName: line.client.nameRaw,
      serviceName: line.service.conceptRaw,
      total: line.total,
      suggestedUserId: suggestedByClient.get(line.clientId) ?? null,
    }));

    return mapped.sort((a, b) => {
      const aEmpty = a.manager.trim().length === 0;
      const bEmpty = b.manager.trim().length === 0;
      if (aEmpty !== bEmpty) return aEmpty ? -1 : 1;
      return b.date.getTime() - a.date.getTime();
    });
  }

  async assignManager(lineId: number, userId: number) {
    await prisma.invoiceLine.update({
      where: { id: lineId },
      data: { managerUserId: userId },
    });
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

    let updated = direct.count;
    for (const line of needsNormalization) {
      if (normalizeName(line.manager) !== nameNormalized) continue;
      await prisma.invoiceLine.update({
        where: { id: line.id },
        data: { managerUserId: userId, managerNormalized: nameNormalized },
      });
      updated += 1;
    }

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

  async backfillManagers({
    userCandidates,
    onProgress,
  }: {
    userCandidates: { id: number; nameNormalized: string }[];
    onProgress?: (progress: BackfillProgress) => Promise<void> | void;
  }) {
    const lines = await prisma.invoiceLine.findMany({
      where: {
        OR: [{ managerUserId: null }, { managerNormalized: null }],
      },
      select: { id: true, manager: true, managerNormalized: true, managerUserId: true },
    });

    const total = lines.length;
    const progressBatch = 100;
    if (onProgress) {
      await onProgress({ processed: 0, total });
    }

    let updated = 0;
    let processed = 0;
    for (const line of lines) {
      const normalized = line.managerNormalized ?? normalizeName(line.manager);
      const match = matchUserId(line.manager, userCandidates);
      const userId = match.userId;
      await prisma.invoiceLine.update({
        where: { id: line.id },
        data: {
          managerUserId: line.managerUserId ?? userId ?? null,
          managerNormalized: normalized,
        },
      });
      if (line.managerUserId == null && userId) {
        updated += 1;
      }
      processed += 1;
      if (onProgress && (processed % progressBatch === 0 || processed === total)) {
        await onProgress({ processed, total });
      }
    }

    return updated;
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}

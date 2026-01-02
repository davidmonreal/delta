import { prisma } from "@/lib/db";
import { normalizeName } from "@/lib/normalize";
import { matchUserId } from "@/lib/match-user";

import type { InvoiceRepository, UnmatchedInvoiceLine } from "../ports/invoiceRepository";

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
        client: { select: { nameRaw: true } },
        service: { select: { conceptRaw: true } },
      },
    });

    return lines.map((line) => ({
      id: line.id,
      date: line.date,
      manager: line.manager,
      managerNormalized: line.managerNormalized,
      clientName: line.client.nameRaw,
      serviceName: line.service.conceptRaw,
      total: line.total,
    }));
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

  async backfillManagers({
    userCandidates,
  }: {
    userCandidates: { id: number; nameNormalized: string }[];
  }) {
    const lines = await prisma.invoiceLine.findMany({
      where: {
        OR: [{ managerUserId: null }, { managerNormalized: null }],
      },
      select: { id: true, manager: true, managerNormalized: true, managerUserId: true },
    });

    let updated = 0;
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
    }

    return updated;
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}

import { prisma } from "@/lib/db";
import { normalizeName } from "@/lib/normalize";

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

  async backfillManagers({ userLookup }: { userLookup: Map<string, number> }) {
    const lines = await prisma.invoiceLine.findMany({
      where: { managerUserId: null },
      select: { id: true, manager: true, managerNormalized: true },
    });

    let updated = 0;
    for (const line of lines) {
      const normalized = line.managerNormalized ?? normalizeName(line.manager);
      const userId = userLookup.get(normalized);
      if (!userId) continue;
      await prisma.invoiceLine.update({
        where: { id: line.id },
        data: {
          managerUserId: userId,
          managerNormalized: normalized,
        },
      });
      updated += 1;
    }

    return updated;
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}

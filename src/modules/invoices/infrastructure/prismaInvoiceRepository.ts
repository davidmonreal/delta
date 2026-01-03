import { prisma } from "@/lib/db";
import { normalizeName } from "@/lib/normalize";
import { matchUserId } from "@/lib/match-user";

import type {
  DuplicateInvoiceGroup,
  InvoiceRepository,
  UnmatchedInvoiceLine,
} from "../ports/invoiceRepository";

export class PrismaInvoiceRepository implements InvoiceRepository {
  private async getLatestUploadSourceFile() {
    const latest = await prisma.invoiceLine.findFirst({
      where: {
        sourceFile: {
          startsWith: "upload-",
        },
      },
      orderBy: { sourceFile: "desc" },
      select: { sourceFile: true },
    });

    return latest?.sourceFile ?? null;
  }

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

  async listDuplicates(limit?: number): Promise<DuplicateInvoiceGroup[]> {
    const groups = await prisma.invoiceLine.groupBy({
      by: ["series", "albaran"],
      where: {
        series: { not: null },
        albaran: { not: null },
      },
      _count: { id: true },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    const duplicateGroups = groups.filter((group) => {
      const count =
        group._count && typeof group._count === "object" ? (group._count.id ?? 0) : 0;
      return count > 1;
    });

    const limitedGroups =
      limit && duplicateGroups.length > limit
        ? duplicateGroups.slice(0, limit)
        : duplicateGroups;

    if (limitedGroups.length === 0) return [];

    const samples = await Promise.all(
      limitedGroups.map((group) =>
        prisma.invoiceLine.findFirst({
          where: {
            series: group.series,
            albaran: group.albaran,
          },
          orderBy: { date: "desc" },
          select: {
            date: true,
            manager: true,
            total: true,
            series: true,
            albaran: true,
            numero: true,
            client: { select: { nameRaw: true } },
            service: { select: { conceptRaw: true } },
          },
        }),
      ),
    );

    return limitedGroups.map((group, index) => {
      const count =
        group._count && typeof group._count === "object" ? (group._count.id ?? 0) : 0;
      const sample = samples[index];
      return {
        key: `${group.series ?? ""}|${group.albaran ?? ""}`,
        count,
        date: sample?.date ?? new Date(0),
        manager: sample?.manager ?? "",
        clientName: sample?.client.nameRaw ?? "Client desconegut",
        serviceName: sample?.service.conceptRaw ?? "Servei desconegut",
        total: sample?.total ?? 0,
        series: sample?.series ?? null,
        albaran: sample?.albaran ?? null,
        numero: sample?.numero ?? null,
      };
    });
  }

  async deleteDuplicates(): Promise<number> {
    const sourceFile = await this.getLatestUploadSourceFile();
    if (!sourceFile) return 0;

    const latestPairs = await prisma.invoiceLine.findMany({
      where: {
        sourceFile,
        series: { not: null },
        albaran: { not: null },
      },
      distinct: ["series", "albaran"],
      select: { series: true, albaran: true },
    });

    if (latestPairs.length === 0) return 0;

    const groups = await prisma.invoiceLine.groupBy({
      by: ["series", "albaran"],
      where: {
        OR: latestPairs.map((pair) => ({
          series: pair.series,
          albaran: pair.albaran,
        })),
        series: { not: null },
        albaran: { not: null },
      },
      _count: { id: true },
    });

    const duplicateKeys = groups.filter((item) => {
      const count =
        item._count && typeof item._count === "object" ? (item._count.id ?? 0) : 0;
      return count > 1;
    });

    if (duplicateKeys.length === 0) return 0;

    const result = await prisma.invoiceLine.deleteMany({
      where: {
        sourceFile,
        OR: duplicateKeys.map((item) => ({
          series: item.series,
          albaran: item.albaran,
        })),
      },
    });

    return result.count;
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}

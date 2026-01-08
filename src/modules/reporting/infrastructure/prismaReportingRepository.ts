import { prisma } from "@/lib/db";

import type {
  ReportingRepository,
  YearMonth,
  MonthlyGroupRow,
  MonthlyRefRow,
  MonthlyManagerRow,
  MonthlyLineRow,
  ClientGroupRow,
  ClientRefRow,
  ClientManagerRow,
  ClientLineRow,
  ClientInvoiceLineRow,
  ClientRow,
  ServiceRow,
} from "../ports/reportingRepository";

export class PrismaReportingRepository implements ReportingRepository {
  async getLatestEntry(params?: { managerUserId?: number }): Promise<YearMonth | null> {
    return prisma.invoiceLine.findFirst({
      where: {
        ...(params?.managerUserId ? { managerUserId: params.managerUserId } : {}),
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      select: { year: true, month: true },
    });
  }

  async getLatestEntryForClient(
    clientId: number,
    params?: { managerUserId?: number },
  ): Promise<YearMonth | null> {
    return prisma.invoiceLine.findFirst({
      where: {
        clientId,
        ...(params?.managerUserId ? { managerUserId: params.managerUserId } : {}),
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      select: { year: true, month: true },
    });
  }

  async getMonthlyGroups({
    years,
    month,
    managerUserId,
  }: {
    years: number[];
    month: number;
    managerUserId?: number;
  }) {
    const rows = await prisma.invoiceLine.groupBy({
      by: ["clientId", "serviceId", "year", "month"],
      where: {
        month,
        year: { in: years },
        ...(managerUserId ? { managerUserId } : {}),
      },
      _sum: {
        total: true,
        units: true,
      },
    });
    return rows.map((row) => ({
      clientId: row.clientId,
      serviceId: row.serviceId,
      year: row.year,
      month: row.month,
      total: row._sum.total ?? null,
      units: row._sum.units ?? null,
    })) satisfies MonthlyGroupRow[];
  }

  async getMonthlyRefs({
    years,
    month,
    managerUserId,
  }: {
    years: number[];
    month: number;
    managerUserId?: number;
  }) {
    const rows = await prisma.invoiceLine.findMany({
      where: {
        month,
        year: { in: years },
        ...(managerUserId ? { managerUserId } : {}),
      },
      select: {
        clientId: true,
        serviceId: true,
        year: true,
        month: true,
        series: true,
        albaran: true,
        numero: true,
      },
    });
    return rows;
  }

  async getMonthlyManagers({
    years,
    month,
    managerUserId,
  }: {
    years: number[];
    month: number;
    managerUserId?: number;
  }): Promise<MonthlyManagerRow[]> {
    const rows = await prisma.invoiceLine.findMany({
      where: {
        month,
        year: { in: years },
        ...(managerUserId ? { managerUserId } : {}),
      },
      orderBy: [{ date: "desc" }],
      distinct: ["clientId", "serviceId", "year"],
      select: {
        clientId: true,
        serviceId: true,
        year: true,
        month: true,
        manager: true,
        managerUser: { select: { name: true } },
      },
    });

    return rows.map((row) => {
      const rawName = row.managerUser?.name ?? row.manager ?? "";
      const managerName = rawName.trim().length ? rawName.trim() : null;
      return {
        clientId: row.clientId,
        serviceId: row.serviceId,
        year: row.year,
        month: row.month,
        managerName,
      };
    });
  }

  async getMonthlyLines({
    years,
    month,
    managerUserId,
  }: {
    years: number[];
    month: number;
    managerUserId?: number;
  }): Promise<MonthlyLineRow[]> {
    const rows = await prisma.invoiceLine.findMany({
      where: {
        month,
        year: { in: years },
        ...(managerUserId ? { managerUserId } : {}),
      },
      select: {
        clientId: true,
        serviceId: true,
        year: true,
        month: true,
        total: true,
        units: true,
        series: true,
        albaran: true,
        numero: true,
        manager: true,
        managerUser: { select: { name: true } },
      },
    });

    return rows.map((row) => ({
      clientId: row.clientId,
      serviceId: row.serviceId,
      year: row.year,
      month: row.month,
      total: row.total,
      units: row.units,
      series: row.series,
      albaran: row.albaran,
      numero: row.numero,
      managerName: (row.managerUser?.name ?? row.manager ?? "").trim() || null,
    }));
  }

  async getClientsByIds(ids: number[]): Promise<ClientRow[]> {
    if (ids.length === 0) return [];
    return prisma.client.findMany({
      where: { id: { in: ids } },
      select: { id: true, nameRaw: true },
    });
  }

  async getServicesByIds(ids: number[]): Promise<ServiceRow[]> {
    if (ids.length === 0) return [];
    return prisma.service.findMany({
      where: { id: { in: ids } },
      select: { id: true, conceptRaw: true },
    });
  }

  async getClientById(id: number): Promise<ClientRow | null> {
    return prisma.client.findUnique({
      where: { id },
      select: { id: true, nameRaw: true },
    });
  }

  async getClientGroups({
    clientId,
    years,
    month,
    managerUserId,
  }: {
    clientId: number;
    years: number[];
    month: number;
    managerUserId?: number;
  }) {
    const rows = await prisma.invoiceLine.groupBy({
      by: ["serviceId", "year", "month"],
      where: {
        clientId,
        month,
        year: { in: years },
        ...(managerUserId ? { managerUserId } : {}),
      },
      _sum: {
        total: true,
        units: true,
      },
    });
    return rows.map((row) => ({
      serviceId: row.serviceId,
      year: row.year,
      month: row.month,
      total: row._sum.total ?? null,
      units: row._sum.units ?? null,
    })) satisfies ClientGroupRow[];
  }

  async getClientRefs({
    clientId,
    years,
    month,
    managerUserId,
  }: {
    clientId: number;
    years: number[];
    month: number;
    managerUserId?: number;
  }) {
    const rows = await prisma.invoiceLine.findMany({
      where: {
        clientId,
        month,
        year: { in: years },
        ...(managerUserId ? { managerUserId } : {}),
      },
      select: {
        serviceId: true,
        year: true,
        month: true,
        series: true,
        albaran: true,
        numero: true,
      },
    });
    return rows;
  }

  async getClientManagers({
    clientId,
    years,
    month,
    managerUserId,
  }: {
    clientId: number;
    years: number[];
    month: number;
    managerUserId?: number;
  }): Promise<ClientManagerRow[]> {
    const rows = await prisma.invoiceLine.findMany({
      where: {
        clientId,
        month,
        year: { in: years },
        ...(managerUserId ? { managerUserId } : {}),
      },
      orderBy: [{ date: "desc" }],
      distinct: ["serviceId", "year"],
      select: {
        serviceId: true,
        year: true,
        month: true,
        manager: true,
        managerUser: { select: { name: true } },
      },
    });

    return rows.map((row) => {
      const rawName = row.managerUser?.name ?? row.manager ?? "";
      const managerName = rawName.trim().length ? rawName.trim() : null;
      return {
        serviceId: row.serviceId,
        year: row.year,
        month: row.month,
        managerName,
      };
    });
  }

  async getClientLines({
    clientId,
    years,
    month,
    managerUserId,
  }: {
    clientId: number;
    years: number[];
    month: number;
    managerUserId?: number;
  }): Promise<ClientLineRow[]> {
    const rows = await prisma.invoiceLine.findMany({
      where: {
        clientId,
        month,
        year: { in: years },
        ...(managerUserId ? { managerUserId } : {}),
      },
      select: {
        serviceId: true,
        year: true,
        month: true,
        total: true,
        units: true,
        series: true,
        albaran: true,
        numero: true,
        manager: true,
        managerUser: { select: { name: true } },
      },
    });

    return rows.map((row) => ({
      serviceId: row.serviceId,
      year: row.year,
      month: row.month,
      total: row.total,
      units: row.units,
      series: row.series,
      albaran: row.albaran,
      numero: row.numero,
      managerName: (row.managerUser?.name ?? row.manager ?? "").trim() || null,
    }));
  }

  async getClientInvoiceLines({
    clientId,
    managerUserId,
  }: {
    clientId: number;
    managerUserId?: number;
  }): Promise<ClientInvoiceLineRow[]> {
    const rows = await prisma.invoiceLine.findMany({
      where: {
        clientId,
        ...(managerUserId ? { managerUserId } : {}),
      },
      orderBy: [{ year: "desc" }, { month: "desc" }, { date: "desc" }],
      select: {
        id: true,
        year: true,
        month: true,
        date: true,
        total: true,
        units: true,
        serviceId: true,
        series: true,
        albaran: true,
        numero: true,
        manager: true,
        managerUser: { select: { name: true } },
        service: { select: { conceptRaw: true } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      year: row.year,
      month: row.month,
      date: row.date,
      total: row.total,
      units: row.units,
      serviceId: row.serviceId,
      serviceName: row.service.conceptRaw,
      managerName: (row.managerUser?.name ?? row.manager ?? "").trim() || null,
      series: row.series,
      albaran: row.albaran,
      numero: row.numero,
    }));
  }
}

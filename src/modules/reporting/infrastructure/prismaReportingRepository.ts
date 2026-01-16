import { prisma } from "@/lib/db";
import { Prisma, type PrismaClient } from "../../../generated/prisma";
import { resolveManagerName } from "../domain/managerName";

import type {
  ReportingRepository,
  YearMonth,
  MonthlyGroupRow,
  MonthlyManagerRow,
  MonthlyLineRow,
  ClientGroupRow,
  ClientManagerRow,
  ClientLineRow,
  ClientInvoiceLineRow,
  ClientRow,
  ServiceRow,
} from "../ports/reportingRepository";

type InvoiceLineWhereParams = {
  years?: number[];
  month?: number;
  managerUserId?: number;
  clientId?: number;
};

type ManagerSelectRow = {
  manager: string | null;
  managerUser: { name: string | null } | null;
};

function buildInvoiceLineWhere(params: InvoiceLineWhereParams) {
  return {
    ...(params.clientId ? { clientId: params.clientId } : {}),
    ...(params.month ? { month: params.month } : {}),
    ...(params.years ? { year: { in: params.years } } : {}),
    ...(params.managerUserId ? { managerUserId: params.managerUserId } : {}),
  };
}

function resolveManagerNameRow(row: ManagerSelectRow) {
  return resolveManagerName(row.manager, row.managerUser?.name);
}

function toNumber(value: Prisma.Decimal | number) {
  return typeof value === "number" ? value : value.toNumber();
}

function toNumberOrNull(value: Prisma.Decimal | number | null) {
  if (value === null) return null;
  return toNumber(value);
}

const managerSelect = Prisma.validator<Prisma.InvoiceLineSelect>()({
  manager: true,
  managerUser: { select: { name: true } },
});
const monthlyRefSelect = Prisma.validator<Prisma.InvoiceLineSelect>()({
  clientId: true,
  serviceId: true,
  year: true,
  month: true,
  series: true,
  albaran: true,
  numero: true,
});
const clientRefSelect = Prisma.validator<Prisma.InvoiceLineSelect>()({
  serviceId: true,
  year: true,
  month: true,
  series: true,
  albaran: true,
  numero: true,
});

export class PrismaReportingRepository implements ReportingRepository {
  private prismaClient: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prismaClient = prismaClient;
  }

  private findInvoiceLines<S extends Prisma.InvoiceLineSelect>({
    where,
    select,
    orderBy,
    distinct,
  }: {
    where: InvoiceLineWhereParams;
    select: S;
    orderBy?: Prisma.InvoiceLineOrderByWithRelationInput[];
    distinct?: Prisma.InvoiceLineScalarFieldEnum[];
  }): Promise<Prisma.InvoiceLineGetPayload<{ select: S }>[]> {
    return this.prismaClient.invoiceLine.findMany({
      where: buildInvoiceLineWhere(where),
      select,
      orderBy,
      distinct,
    });
  }

  private groupInvoiceLines({
    by,
    where,
  }: {
    by: Array<"clientId" | "serviceId" | "year" | "month">;
    where: InvoiceLineWhereParams;
  }) {
    return this.prismaClient.invoiceLine.groupBy({
      by,
      where: buildInvoiceLineWhere(where),
      _sum: {
        total: true,
        units: true,
      },
    });
  }

  async getLatestEntry(params?: { managerUserId?: number }): Promise<YearMonth | null> {
    return this.prismaClient.invoiceLine.findFirst({
      where: buildInvoiceLineWhere({ managerUserId: params?.managerUserId }),
      orderBy: [{ year: "desc" }, { month: "desc" }],
      select: { year: true, month: true },
    });
  }

  async getLatestEntryForClient(
    clientId: number,
    params?: { managerUserId?: number },
  ): Promise<YearMonth | null> {
    return this.prismaClient.invoiceLine.findFirst({
      where: buildInvoiceLineWhere({
        clientId,
        managerUserId: params?.managerUserId,
      }),
      orderBy: [{ year: "desc" }, { month: "desc" }],
      select: { year: true, month: true },
    });
  }

  async getMonthlyLinesForMonths({
    months,
    managerUserId,
    clientId,
  }: {
    months: YearMonth[];
    managerUserId?: number;
    clientId?: number;
  }): Promise<MonthlyLineRow[]> {
    if (months.length === 0) return [];
    const uniqueMonths = Array.from(
      new Map(months.map((entry) => [`${entry.year}-${entry.month}`, entry])).values(),
    );
    const rows = await this.prismaClient.invoiceLine.findMany({
      where: {
        ...(clientId ? { clientId } : {}),
        ...(managerUserId ? { managerUserId } : {}),
        OR: uniqueMonths.map((entry) => ({
          year: entry.year,
          month: entry.month,
        })),
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
        managerUserId: true,
        ...managerSelect,
      },
    });

    return rows.map((row) => ({
      clientId: row.clientId,
      serviceId: row.serviceId,
      year: row.year,
      month: row.month,
      total: toNumber(row.total),
      units: toNumber(row.units),
      series: row.series,
      albaran: row.albaran,
      numero: row.numero,
      managerUserId: row.managerUserId,
      managerName: resolveManagerNameRow(row),
    }));
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
    const rows = await this.groupInvoiceLines({
      by: ["clientId", "serviceId", "year", "month"],
      where: { years, month, managerUserId },
    });
    return rows.map((row) => ({
      clientId: row.clientId,
      serviceId: row.serviceId,
      year: row.year,
      month: row.month,
      total: toNumberOrNull(row._sum.total),
      units: toNumberOrNull(row._sum.units),
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
    const rows = await this.findInvoiceLines({
      where: { years, month, managerUserId },
      select: monthlyRefSelect,
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
    const rows = await this.findInvoiceLines({
      where: { years, month, managerUserId },
      orderBy: [{ date: "desc" }],
      distinct: ["clientId", "serviceId", "year"],
      select: {
        clientId: true,
        serviceId: true,
        year: true,
        month: true,
        ...managerSelect,
      },
    });

    return rows.map((row) => {
      return {
        clientId: row.clientId,
        serviceId: row.serviceId,
        year: row.year,
        month: row.month,
        managerName: resolveManagerNameRow(row),
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
    const rows = await this.findInvoiceLines({
      where: { years, month, managerUserId },
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
        managerUserId: true,
        ...managerSelect,
      },
    });

    return rows.map((row) => ({
      clientId: row.clientId,
      serviceId: row.serviceId,
      year: row.year,
      month: row.month,
      total: toNumber(row.total),
      units: toNumber(row.units),
      series: row.series,
      albaran: row.albaran,
      numero: row.numero,
      managerUserId: row.managerUserId,
      managerName: resolveManagerNameRow(row),
    }));
  }

  async getClientsByIds(ids: number[]): Promise<ClientRow[]> {
    if (ids.length === 0) return [];
    return this.prismaClient.client.findMany({
      where: { id: { in: ids } },
      select: { id: true, nameRaw: true },
    });
  }

  async getServicesByIds(ids: number[]): Promise<ServiceRow[]> {
    if (ids.length === 0) return [];
    return this.prismaClient.service.findMany({
      where: { id: { in: ids } },
      select: { id: true, conceptRaw: true },
    });
  }

  async getClientById(id: number): Promise<ClientRow | null> {
    return this.prismaClient.client.findUnique({
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
    const rows = await this.groupInvoiceLines({
      by: ["serviceId", "year", "month"],
      where: { clientId, years, month, managerUserId },
    });
    return rows.map((row) => ({
      serviceId: row.serviceId,
      year: row.year,
      month: row.month,
      total: toNumberOrNull(row._sum.total),
      units: toNumberOrNull(row._sum.units),
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
    const rows = await this.findInvoiceLines({
      where: { clientId, years, month, managerUserId },
      select: clientRefSelect,
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
    const rows = await this.findInvoiceLines({
      where: { clientId, years, month, managerUserId },
      orderBy: [{ date: "desc" }],
      distinct: ["serviceId", "year"],
      select: {
        serviceId: true,
        year: true,
        month: true,
        ...managerSelect,
      },
    });

    return rows.map((row) => {
      return {
        serviceId: row.serviceId,
        year: row.year,
        month: row.month,
        managerName: resolveManagerNameRow(row),
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
    const rows = await this.findInvoiceLines({
      where: { clientId, years, month, managerUserId },
      select: {
        serviceId: true,
        year: true,
        month: true,
        total: true,
        units: true,
        series: true,
        albaran: true,
        numero: true,
        managerUserId: true,
        ...managerSelect,
      },
    });

    return rows.map((row) => ({
      serviceId: row.serviceId,
      year: row.year,
      month: row.month,
      total: toNumber(row.total),
      units: toNumber(row.units),
      series: row.series,
      albaran: row.albaran,
      numero: row.numero,
      managerUserId: row.managerUserId,
      managerName: resolveManagerNameRow(row),
    }));
  }

  async getClientInvoiceLines({
    clientId,
    managerUserId,
  }: {
    clientId: number;
    managerUserId?: number;
  }): Promise<ClientInvoiceLineRow[]> {
    const rows = await this.findInvoiceLines({
      where: { clientId, managerUserId },
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
        ...managerSelect,
        service: { select: { conceptRaw: true } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      year: row.year,
      month: row.month,
      date: row.date,
      total: toNumber(row.total),
      units: toNumber(row.units),
      serviceId: row.serviceId,
      serviceName: row.service.conceptRaw,
      managerName: resolveManagerNameRow(row),
      series: row.series,
      albaran: row.albaran,
      numero: row.numero,
    }));
  }
}

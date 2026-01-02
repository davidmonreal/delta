import { ClientIdSchema } from "../dto/reportingSchemas";
import type { ReportingRepository } from "../ports/reportingRepository";
import { formatRef } from "./formatRef";
import { resolveFilters } from "./filters";

export type ClientSummaryRow = {
  serviceId: number;
  serviceName: string;
  previousRef: string | null;
  currentRef: string | null;
  previousTotal: number;
  currentTotal: number;
  previousUnits: number;
  currentUnits: number;
  previousUnitPrice: number;
  currentUnitPrice: number;
  deltaPrice: number;
  isMissing: boolean;
  percentDelta?: number;
};

export async function getClientComparison({
  repo,
  rawFilters,
  rawClientId,
}: {
  repo: ReportingRepository;
  rawFilters: { year?: string; month?: string; show?: string };
  rawClientId: string;
}) {
  const parsedClientId = ClientIdSchema.safeParse(rawClientId);
  if (!parsedClientId.success) {
    return { notFound: true as const };
  }
  const clientId = parsedClientId.data;

  const client = await repo.getClientById(clientId);
  if (!client) {
    return { notFound: true as const };
  }

  const latestEntry = await repo.getLatestEntryForClient(clientId);
  const defaults = {
    year: latestEntry?.year ?? new Date().getFullYear(),
    month: latestEntry?.month ?? new Date().getMonth() + 1,
  };

  const filters = resolveFilters({ raw: rawFilters, defaults });

  const groups = await repo.getClientGroups({
    clientId,
    years: [filters.previousYear, filters.year],
    month: filters.month,
  });

  const refs = await repo.getClientRefs({
    clientId,
    years: [filters.previousYear, filters.year],
    month: filters.month,
  });

  const refMap = new Map<string, string>();
  for (const ref of refs) {
    const key = `${ref.serviceId}-${ref.year}`;
    if (refMap.has(key)) continue;
    const label = formatRef(ref.series, ref.albaran, ref.numero);
    if (label) refMap.set(key, label);
  }

  const serviceIds = Array.from(new Set(groups.map((group) => group.serviceId)));
  const services = await repo.getServicesByIds(serviceIds);
  const serviceMap = new Map(
    services.map((service) => [service.id, service.conceptRaw]),
  );

  const rows = new Map<number, ClientSummaryRow>();

  for (const group of groups) {
    const existing = rows.get(group.serviceId) ?? {
      serviceId: group.serviceId,
      serviceName: serviceMap.get(group.serviceId) ?? "Unknown service",
      previousRef: refMap.get(`${group.serviceId}-${filters.previousYear}`) ?? null,
      currentRef: refMap.get(`${group.serviceId}-${filters.year}`) ?? null,
      previousTotal: 0,
      currentTotal: 0,
      previousUnits: 0,
      currentUnits: 0,
      previousUnitPrice: Number.NaN,
      currentUnitPrice: Number.NaN,
      deltaPrice: Number.NaN,
      isMissing: false,
    };

    if (group.year === filters.year) {
      existing.currentTotal = group.total ?? 0;
      existing.currentUnits = group.units ?? 0;
      existing.currentRef =
        refMap.get(`${group.serviceId}-${filters.year}`) ?? existing.currentRef;
    } else {
      existing.previousTotal = group.total ?? 0;
      existing.previousUnits = group.units ?? 0;
      existing.previousRef =
        refMap.get(`${group.serviceId}-${filters.previousYear}`) ??
        existing.previousRef;
    }

    rows.set(group.serviceId, existing);
  }

  const summaries = Array.from(rows.values())
    .map((row) => {
      const previousUnitPrice =
        row.previousUnits > 0 ? row.previousTotal / row.previousUnits : Number.NaN;
      const currentUnitPrice =
        row.currentUnits > 0 ? row.currentTotal / row.currentUnits : Number.NaN;
      const hasBoth = row.previousUnits > 0 && row.currentUnits > 0;
      const deltaPrice = hasBoth
        ? currentUnitPrice - previousUnitPrice
        : Number.NaN;
      const isMissing = row.previousUnits > 0 && row.currentUnits === 0;
      return {
        ...row,
        previousUnitPrice,
        currentUnitPrice,
        deltaPrice,
        isMissing,
        percentDelta:
          hasBoth && previousUnitPrice > 0
            ? ((currentUnitPrice - previousUnitPrice) / previousUnitPrice) * 100
            : undefined,
      };
    })
    .filter((row) => {
      if (filters.showNegative) return row.isMissing || row.deltaPrice < -0.001;
      if (filters.showEqual) return Math.abs(row.deltaPrice) <= 0.001;
      if (filters.showPositive) return row.deltaPrice > 0.001;
      return row.deltaPrice < -0.001;
    })
    .sort((a, b) => {
      const aScore = a.isMissing ? Number.POSITIVE_INFINITY : Math.abs(a.deltaPrice);
      const bScore = b.isMissing ? Number.POSITIVE_INFINITY : Math.abs(b.deltaPrice);
      return bScore - aScore;
    });

  const sumDeltaVisible = summaries.reduce(
    (total, row) => total + (row.currentTotal - row.previousTotal),
    0,
  );

  return {
    notFound: false as const,
    clientId,
    client,
    filters,
    summaries,
    sumDeltaVisible,
  };
}

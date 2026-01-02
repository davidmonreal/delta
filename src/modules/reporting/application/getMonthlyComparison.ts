import type { ReportingRepository } from "../ports/reportingRepository";
import { formatRef } from "./formatRef";
import { resolveFilters } from "./filters";
import { applySummaryMetrics, filterSummaries, sortSummaries } from "./summaryUtils";

export type MonthlySummaryRow = {
  clientId: number;
  serviceId: number;
  clientName: string;
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

export type MonthlyComparisonResult = {
  filters: ReturnType<typeof resolveFilters>;
  summaries: MonthlySummaryRow[];
  visibleRows: MonthlySummaryRow[];
  negativeMissing: MonthlySummaryRow[];
  sumDeltaVisible: number;
  sumDeltaMissing: number;
};

export async function getMonthlyComparison({
  repo,
  rawFilters,
}: {
  repo: ReportingRepository;
  rawFilters: { year?: string; month?: string; show?: string };
}): Promise<MonthlyComparisonResult> {
  const latestEntry = await repo.getLatestEntry();
  const defaults = {
    year: latestEntry?.year ?? new Date().getFullYear(),
    month: latestEntry?.month ?? new Date().getMonth() + 1,
  };

  const filters = resolveFilters({ raw: rawFilters, defaults });

  const groups = await repo.getMonthlyGroups({
    years: [filters.previousYear, filters.year],
    month: filters.month,
  });

  const refs = await repo.getMonthlyRefs({
    years: [filters.previousYear, filters.year],
    month: filters.month,
  });

  const refMap = new Map<string, string>();
  for (const ref of refs) {
    const key = `${ref.clientId}-${ref.serviceId}-${ref.year}`;
    if (refMap.has(key)) continue;
    const label = formatRef(ref.series, ref.albaran, ref.numero);
    if (label) refMap.set(key, label);
  }

  const clientIds = Array.from(new Set(groups.map((group) => group.clientId)));
  const serviceIds = Array.from(new Set(groups.map((group) => group.serviceId)));

  const [clients, services] = await Promise.all([
    repo.getClientsByIds(clientIds),
    repo.getServicesByIds(serviceIds),
  ]);

  const clientMap = new Map(clients.map((client) => [client.id, client.nameRaw]));
  const serviceMap = new Map(
    services.map((service) => [service.id, service.conceptRaw]),
  );

  const rows = new Map<string, MonthlySummaryRow>();

  for (const group of groups) {
    const key = `${group.clientId}-${group.serviceId}`;
    const existing = rows.get(key) ?? {
      clientId: group.clientId,
      serviceId: group.serviceId,
      clientName: clientMap.get(group.clientId) ?? "Unknown client",
      serviceName: serviceMap.get(group.serviceId) ?? "Unknown service",
      previousRef:
        refMap.get(`${group.clientId}-${group.serviceId}-${filters.previousYear}`) ??
        null,
      currentRef:
        refMap.get(`${group.clientId}-${group.serviceId}-${filters.year}`) ?? null,
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
        refMap.get(`${group.clientId}-${group.serviceId}-${filters.year}`) ??
        existing.currentRef;
    } else {
      existing.previousTotal = group.total ?? 0;
      existing.previousUnits = group.units ?? 0;
      existing.previousRef =
        refMap.get(`${group.clientId}-${group.serviceId}-${filters.previousYear}`) ??
        existing.previousRef;
    }

    rows.set(key, existing);
  }

  const summaries = sortSummaries(
    filterSummaries(
      Array.from(rows.values()).map((row) => applySummaryMetrics(row)),
      filters,
    ),
  );

  const negativeWithPrice = filters.showNegative
    ? summaries.filter((row) => !row.isMissing)
    : [];
  const negativeMissing = filters.showNegative
    ? summaries.filter((row) => row.isMissing)
    : [];
  const visibleRows = filters.showNegative ? negativeWithPrice : summaries;
  const sumDeltaVisible = visibleRows.reduce(
    (total, row) => total + (row.currentTotal - row.previousTotal),
    0,
  );
  const sumDeltaMissing = negativeMissing.reduce(
    (total, row) => total + (row.currentTotal - row.previousTotal),
    0,
  );

  return {
    filters,
    summaries,
    visibleRows,
    negativeMissing,
    sumDeltaVisible,
    sumDeltaMissing,
  };
}

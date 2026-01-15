import type { ReportingRepository } from "../ports/reportingRepository";
import { formatRef } from "./formatRef";
import { pairLines } from "./pairLines";
import { resolveFilters } from "./filters";
import { applySummaryMetrics, filterSummaries, sortSummaries } from "./summaryUtils";

export type MonthlySummaryRow = {
  id: string;
  clientId: number;
  serviceId: number;
  clientName: string;
  serviceName: string;
  managerName?: string | null;
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
  sumDeltaVisible: number;
};

export async function getMonthlyComparison({
  repo,
  rawFilters,
  managerUserId,
}: {
  repo: ReportingRepository;
  rawFilters: {
    year?: string | string[];
    month?: string | string[];
    show?: string | string[];
    pctUnder?: string | string[];
    pctEqual?: string | string[];
    pctOver?: string | string[];
  };
  managerUserId?: number;
}): Promise<MonthlyComparisonResult> {
  // Business rule: compare the same month across consecutive years and classify
  // items as missing/new/changed for manager review.
  const latestEntry = await repo.getLatestEntry({ managerUserId });
  const defaults = {
    year: latestEntry?.year ?? new Date().getFullYear(),
    month: latestEntry?.month ?? new Date().getMonth() + 1,
  };

  const filters = resolveFilters({ raw: rawFilters, defaults });

  const lines = await repo.getMonthlyLines({
    years: [filters.previousYear, filters.year],
    month: filters.month,
    managerUserId,
  });

  const clientIds = Array.from(new Set(lines.map((line) => line.clientId)));
  const serviceIds = Array.from(new Set(lines.map((line) => line.serviceId)));

  const [clients, services] = await Promise.all([
    repo.getClientsByIds(clientIds),
    repo.getServicesByIds(serviceIds),
  ]);

  const clientMap = new Map(clients.map((client) => [client.id, client.nameRaw]));
  const serviceMap = new Map(
    services.map((service) => [service.id, service.conceptRaw]),
  );

  const rows = new Map<string, MonthlySummaryRow[]>();
  const linesByKey = new Map<string, typeof lines>();

  for (const line of lines) {
    const key = `${line.clientId}-${line.serviceId}`;
    const existing = linesByKey.get(key) ?? [];
    existing.push(line);
    linesByKey.set(key, existing);
  }

  let rowCounter = 0;
  for (const [key, serviceLines] of linesByKey) {
    const [clientIdRaw, serviceIdRaw] = key.split("-");
    const clientId = Number(clientIdRaw);
    const serviceId = Number(serviceIdRaw);
    const previous = serviceLines.filter((line) => line.year === filters.previousYear);
    const current = serviceLines.filter((line) => line.year === filters.year);
    const pairing =
      previous.length === 1 && current.length === 1
        ? {
            matches: [{ previous: previous[0], current: current[0] }],
            unmatchedPrevious: [],
            unmatchedCurrent: [],
          }
        : pairLines({
            previous,
            current,
            metric: "unit",
            tolerance: 0.01,
          });
    const { matches, unmatchedPrevious, unmatchedCurrent } = pairing;

    const baseRow = {
      clientId,
      serviceId,
      clientName: clientMap.get(clientId) ?? "Unknown client",
      serviceName: serviceMap.get(serviceId) ?? "Unknown service",
    };

    const summaryRows: MonthlySummaryRow[] = [];
    for (const match of matches) {
      summaryRows.push({
        id: `${clientId}-${serviceId}-${rowCounter++}`,
        ...baseRow,
        managerName: match.current.managerName ?? match.previous.managerName ?? null,
        previousRef: formatRef(
          match.previous.series,
          match.previous.albaran,
          match.previous.numero,
        ),
        currentRef: formatRef(
          match.current.series,
          match.current.albaran,
          match.current.numero,
        ),
        previousTotal: match.previous.total,
        currentTotal: match.current.total,
        previousUnits: match.previous.units,
        currentUnits: match.current.units,
        previousUnitPrice: Number.NaN,
        currentUnitPrice: Number.NaN,
        deltaPrice: Number.NaN,
        isMissing: false,
      });
    }

    for (const prev of unmatchedPrevious) {
      summaryRows.push({
        id: `${clientId}-${serviceId}-${rowCounter++}`,
        ...baseRow,
        managerName: prev.managerName ?? null,
        previousRef: formatRef(prev.series, prev.albaran, prev.numero),
        currentRef: null,
        previousTotal: prev.total,
        currentTotal: 0,
        previousUnits: prev.units,
        currentUnits: 0,
        previousUnitPrice: Number.NaN,
        currentUnitPrice: Number.NaN,
        deltaPrice: Number.NaN,
        isMissing: true,
      });
    }

    for (const curr of unmatchedCurrent) {
      summaryRows.push({
        id: `${clientId}-${serviceId}-${rowCounter++}`,
        ...baseRow,
        managerName: curr.managerName ?? null,
        previousRef: null,
        currentRef: formatRef(curr.series, curr.albaran, curr.numero),
        previousTotal: 0,
        currentTotal: curr.total,
        previousUnits: 0,
        currentUnits: curr.units,
        previousUnitPrice: Number.NaN,
        currentUnitPrice: Number.NaN,
        deltaPrice: Number.NaN,
        isMissing: false,
      });
    }

    rows.set(key, summaryRows);
  }

  const flattened = Array.from(rows.values()).flat();
  const summaries = sortSummaries(
    filterSummaries(
      flattened.map((row) => applySummaryMetrics(row)),
      filters,
    ),
    filters,
  );

  const sumDeltaVisible = summaries.reduce(
    (total, row) => total + (row.currentTotal - row.previousTotal),
    0,
  );

  return {
    filters,
    summaries,
    sumDeltaVisible,
  };
}

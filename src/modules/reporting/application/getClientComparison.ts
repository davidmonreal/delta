import { ClientIdSchema } from "../dto/reportingSchemas";
import type { ReportingRepository } from "../ports/reportingRepository";
import { formatRef } from "./formatRef";
import { pairLines } from "./pairLines";
import { resolveFilters } from "./filters";
import { applySummaryMetrics, filterSummaries, sortSummaries } from "./summaryUtils";

export type ClientSummaryRow = {
  id: string;
  serviceId: number;
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

export type ClientComparisonResult =
  | {
      notFound: true;
    }
  | {
      notFound: false;
      clientId: number;
      client: { id: number; nameRaw: string };
      filters: ReturnType<typeof resolveFilters>;
      summaries: ClientSummaryRow[];
      sumDeltaVisible: number;
    };

export async function getClientComparison({
  repo,
  rawFilters,
  rawClientId,
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
  rawClientId: string;
  managerUserId?: number;
}): Promise<ClientComparisonResult> {
  const parsedClientId = ClientIdSchema.safeParse(rawClientId);
  if (!parsedClientId.success) {
    return { notFound: true as const };
  }
  const clientId = parsedClientId.data;

  const client = await repo.getClientById(clientId);
  if (!client) {
    return { notFound: true as const };
  }

  const latestEntry = await repo.getLatestEntryForClient(clientId, { managerUserId });
  const defaults = {
    year: latestEntry?.year ?? new Date().getFullYear(),
    month: latestEntry?.month ?? new Date().getMonth() + 1,
  };

  const filters = resolveFilters({ raw: rawFilters, defaults });

  const lines = await repo.getClientLines({
    clientId,
    years: [filters.previousYear, filters.year],
    month: filters.month,
    managerUserId,
  });

  const serviceIds = Array.from(new Set(lines.map((line) => line.serviceId)));
  const services = await repo.getServicesByIds(serviceIds);
  const serviceMap = new Map(
    services.map((service) => [service.id, service.conceptRaw]),
  );
  const rows = new Map<number, ClientSummaryRow[]>();
  const linesByService = new Map<number, typeof lines>();

  for (const line of lines) {
    const existing = linesByService.get(line.serviceId) ?? [];
    existing.push(line);
    linesByService.set(line.serviceId, existing);
  }

  let rowCounter = 0;
  for (const [serviceId, serviceLines] of linesByService) {
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
      serviceId,
      serviceName: serviceMap.get(serviceId) ?? "Unknown service",
    };

    const summaryRows: ClientSummaryRow[] = [];
    for (const match of matches) {
      summaryRows.push({
        id: `${serviceId}-${rowCounter++}`,
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
        id: `${serviceId}-${rowCounter++}`,
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
        id: `${serviceId}-${rowCounter++}`,
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

    rows.set(serviceId, summaryRows);
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
    notFound: false as const,
    clientId,
    client,
    filters,
    summaries,
    sumDeltaVisible,
  };
}

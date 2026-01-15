import { ClientIdSchema } from "../dto/reportingSchemas";
import type { ReportingRepository, YearMonth } from "../ports/reportingRepository";
import { formatRef } from "./formatRef";
import { pairLines } from "./pairLines";
import { resolveFilters } from "./filters";
import {
  applySummaryMetrics,
  buildShowCounts,
  filterSummaries,
  sortSummaries,
  type ShowCounts,
} from "./summaryUtils";
import type { LinkedServiceRepository } from "@/modules/linkedServices/ports/linkedServiceRepository";
import type { UserRole } from "@/modules/users/domain/userRole";
import { isSuperadminRole } from "@/modules/users/domain/rolePolicies";

export type ClientSummaryRow = {
  id: string;
  serviceId: number;
  serviceName: string;
  managerName?: string | null;
  managerUserId?: number | null;
  missingReason?: string;
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
      showCounts: ShowCounts;
      sumDeltaVisible: number;
    };

export async function getClientComparison({
  repo,
  linkedServiceRepo,
  viewerRole,
  rawFilters,
  rawClientId,
  managerUserId,
}: {
  repo: ReportingRepository;
  linkedServiceRepo?: LinkedServiceRepository;
  viewerRole?: UserRole;
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
  const includeLinkedMissing =
    filters.showMissing &&
    viewerRole &&
    isSuperadminRole(viewerRole) &&
    linkedServiceRepo;
  const linkedServices = includeLinkedMissing
    ? await linkedServiceRepo.listLinks()
    : [];
  const linkedOffsets = new Set(linkedServices.map((link) => link.offsetMonths));
  const extraOffsets = Array.from(linkedOffsets).filter(
    (offset) => offset !== 0 && offset !== 12,
  );
  const offsetMonthMap = new Map<number, YearMonth>();
  for (const offset of extraOffsets) {
    const shifted = new Date(filters.year, filters.month - 1 - offset, 1);
    offsetMonthMap.set(offset, {
      year: shifted.getFullYear(),
      month: shifted.getMonth() + 1,
    });
  }
  const extraLines = includeLinkedMissing
    ? await repo.getMonthlyLinesForMonths({
        months: Array.from(offsetMonthMap.values()),
        managerUserId,
        clientId,
      })
    : [];

  const serviceIds = new Set<number>();
  for (const line of [...lines, ...extraLines]) {
    serviceIds.add(line.serviceId);
  }
  for (const link of linkedServices) {
    serviceIds.add(link.serviceId);
    serviceIds.add(link.linkedServiceId);
  }
  const services = await repo.getServicesByIds(Array.from(serviceIds));
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
        managerUserId:
          match.current.managerUserId ?? match.previous.managerUserId ?? null,
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
        managerUserId: prev.managerUserId ?? null,
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
        managerUserId: curr.managerUserId ?? null,
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
  if (includeLinkedMissing) {
    const currentLines = lines.filter((line) => line.year === filters.year);
    const previousYearLines = lines.filter(
      (line) => line.year === filters.previousYear,
    );
    const existingMissingKeys = new Set(
      flattened
        .filter((row) => row.previousUnits > 0 && row.currentUnits === 0)
        .map((row) => `${row.serviceId}`),
    );
    const currentKeys = new Set(currentLines.map((line) => `${line.serviceId}`));
    const linkMap = new Map<
      number,
      Array<{ otherServiceId: number; offsetMonths: number }>
    >();
    for (const link of linkedServices) {
      const entries = linkMap.get(link.serviceId) ?? [];
      entries.push({ otherServiceId: link.linkedServiceId, offsetMonths: link.offsetMonths });
      linkMap.set(link.serviceId, entries);
      if (link.linkedServiceId !== link.serviceId) {
        const reverse = linkMap.get(link.linkedServiceId) ?? [];
        reverse.push({ otherServiceId: link.serviceId, offsetMonths: link.offsetMonths });
        linkMap.set(link.linkedServiceId, reverse);
      }
    }
    const triggerLinesByOffset = new Map<number, typeof lines>();
    triggerLinesByOffset.set(0, currentLines);
    triggerLinesByOffset.set(12, previousYearLines);
    for (const [offset, month] of offsetMonthMap.entries()) {
      const scoped = extraLines.filter(
        (line) => line.year === month.year && line.month === month.month,
      );
      triggerLinesByOffset.set(offset, scoped);
    }
    const formatOffsetLabel = (offset: number) => {
      if (offset === 0) return "mateix mes";
      return offset === 1 ? "1 mes" : `${offset} mesos`;
    };
    const linkedMissingRows: ClientSummaryRow[] = [];
    for (const [offset, triggerLines] of triggerLinesByOffset.entries()) {
      for (const trigger of triggerLines) {
        const links = linkMap.get(trigger.serviceId) ?? [];
        for (const link of links) {
          if (link.offsetMonths !== offset) continue;
          const key = `${link.otherServiceId}`;
          if (currentKeys.has(key) || existingMissingKeys.has(key)) {
            continue;
          }
          existingMissingKeys.add(key);
          const triggerLabel =
            serviceMap.get(trigger.serviceId) ?? "Servei desconegut";
          linkedMissingRows.push({
            id: `${link.otherServiceId}-${rowCounter++}`,
            serviceId: link.otherServiceId,
            serviceName: serviceMap.get(link.otherServiceId) ?? "Unknown service",
            managerName: trigger.managerName ?? null,
            managerUserId: trigger.managerUserId ?? null,
            missingReason: `↔ ${triggerLabel} · ${formatOffsetLabel(offset)}`,
            previousRef: null,
            currentRef: null,
            previousTotal: 0,
            currentTotal: 0,
            previousUnits: 0,
            currentUnits: 0,
            previousUnitPrice: Number.NaN,
            currentUnitPrice: Number.NaN,
            deltaPrice: Number.NaN,
            isMissing: true,
          });
        }
      }
    }
    flattened.push(...linkedMissingRows);
  }
  const metricRows = flattened.map((row) => applySummaryMetrics(row));
  const showCounts = buildShowCounts(metricRows, filters);
  const summaries = sortSummaries(
    filterSummaries(metricRows, filters),
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
    showCounts,
    sumDeltaVisible,
  };
}

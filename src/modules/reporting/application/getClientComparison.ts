import { ClientIdSchema } from "../dto/reportingSchemas";
import type { ReportingQueryRepository, YearMonth } from "../ports/reportingRepository";
import { formatRef } from "./formatRef";
import { resolveFilters } from "./filters";
import { pairPeriodLines } from "./pairPeriodLines";
import { applySummaryMetrics, buildShowCounts, type ShowCounts } from "./summaryUtils";
import type { LinkedServiceRepository } from "@/modules/linkedServices/ports/linkedServiceRepository";
import type { UserRole } from "@/modules/users/domain/userRole";
import { isSuperadminRole } from "@/modules/users/domain/rolePolicies";
import { shiftYearMonth } from "../domain/periods";

export type ClientSummaryRow = {
  id: string;
  serviceId: number;
  serviceName: string;
  managerName?: string | null;
  managerUserId?: number | null;
  missingReason?: string;
  isLinkedService?: boolean;
  previousYear?: number;
  previousMonth?: number;
  currentYear?: number;
  currentMonth?: number;
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
  isNew?: boolean;
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
    };

export async function getClientComparison({
  repo,
  linkedServiceRepo,
  viewerRole,
  rawFilters,
  rawClientId,
  managerUserId,
}: {
  repo: ReportingQueryRepository;
  linkedServiceRepo?: LinkedServiceRepository;
  viewerRole?: UserRole;
  rawFilters: {
    year?: string | string[];
    month?: string | string[];
    aStartYear?: string | string[];
    aStartMonth?: string | string[];
    aEndYear?: string | string[];
    aEndMonth?: string | string[];
    bStartYear?: string | string[];
    bStartMonth?: string | string[];
    bEndYear?: string | string[];
    bEndMonth?: string | string[];
    rangeType?: string | string[];
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

  const [previousLines, currentLines] = await Promise.all([
    repo.getClientLines({
      clientId,
      months: filters.periodMonthsA,
      managerUserId,
    }),
    repo.getClientLines({
      clientId,
      months: filters.periodMonthsB,
      managerUserId,
    }),
  ]);
  const lines = [...previousLines, ...currentLines];
  const linkedServices = linkedServiceRepo
    ? await linkedServiceRepo.listLinks()
    : [];
  const linkedServiceIds = new Set<number>();
  for (const link of linkedServices) {
    linkedServiceIds.add(link.serviceId);
    linkedServiceIds.add(link.linkedServiceId);
  }
  const includeLinkedMissing =
    filters.showMissing &&
    viewerRole &&
    isSuperadminRole(viewerRole) &&
    linkedServiceRepo;
  const linkedOffsets = includeLinkedMissing
    ? new Set(linkedServices.map((link) => link.offsetMonths))
    : new Set<number>();
  const extraOffsets = Array.from(linkedOffsets).filter((offset) => offset !== 0);
  const offsetMonthMap = new Map<number, YearMonth[]>();
  for (const offset of extraOffsets) {
    const months = filters.periodMonthsB.map((entry) =>
      shiftYearMonth(entry, -offset),
    );
    offsetMonthMap.set(offset, months);
  }
  const extraMonths = Array.from(offsetMonthMap.values()).flat();
  const extraLines = includeLinkedMissing
    ? await repo.getMonthlyLinesForMonths({
        months: extraMonths,
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
  const periodASet = new Set(
    filters.periodMonthsA.map((entry) => `${entry.year}-${entry.month}`),
  );
  const periodBSet = new Set(
    filters.periodMonthsB.map((entry) => `${entry.year}-${entry.month}`),
  );

  for (const line of lines) {
    const existing = linesByService.get(line.serviceId) ?? [];
    existing.push(line);
    linesByService.set(line.serviceId, existing);
  }

  let rowCounter = 0;
  for (const [serviceId, serviceLines] of linesByService) {
    const previous = serviceLines.filter((line) =>
      periodASet.has(`${line.year}-${line.month}`),
    );
    const current = serviceLines.filter((line) =>
      periodBSet.has(`${line.year}-${line.month}`),
    );
    const pairing =
      previous.length === 1 && current.length === 1
        ? {
            matches: [{ previous: previous[0], current: current[0] }],
            unmatchedPrevious: [],
            unmatchedCurrent: [],
          }
        : pairPeriodLines({
            previous,
            current,
            periodMonthsA: filters.periodMonthsA,
            periodMonthsB: filters.periodMonthsB,
            metric: "unit",
            tolerance: 0.01,
          });
    type LineItem = (typeof unmatchedPrevious)[number];
    const merged = mergeUnmatchedByService<LineItem>(
      unmatchedPrevious,
      unmatchedCurrent,
    );
    const matches = merged.matches.length > 0 ? [...pairing.matches, ...merged.matches] : pairing.matches;
    const unmatchedPrevious = merged.unmatchedPrevious;
    const unmatchedCurrent = merged.unmatchedCurrent;

    const baseRow = {
      serviceId,
      serviceName: serviceMap.get(serviceId) ?? "Unknown service",
      isLinkedService: linkedServiceIds.has(serviceId),
    };

    const summaryRows: ClientSummaryRow[] = [];
    for (const match of matches) {
      summaryRows.push({
        id: `${serviceId}-${rowCounter++}`,
        ...baseRow,
        managerName: match.current.managerName ?? match.previous.managerName ?? null,
        managerUserId:
          match.current.managerUserId ?? match.previous.managerUserId ?? null,
        previousYear: match.previous.year,
        previousMonth: match.previous.month,
        currentYear: match.current.year,
        currentMonth: match.current.month,
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
        previousYear: prev.year,
        previousMonth: prev.month,
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
        currentYear: curr.year,
        currentMonth: curr.month,
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
    const currentLinesForMissing = currentLines;
    const existingMissingKeys = new Set(
      flattened
        .filter((row) => row.previousUnits > 0 && row.currentUnits === 0)
        .map((row) => `${row.serviceId}`),
    );
    const currentKeys = new Set(
      currentLinesForMissing.map((line) => `${line.serviceId}`),
    );
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
    triggerLinesByOffset.set(0, currentLinesForMissing);
    for (const [offset, months] of offsetMonthMap.entries()) {
      const monthSet = new Set(
        months.map((entry) => `${entry.year}-${entry.month}`),
      );
      const scoped = extraLines.filter((line) =>
        monthSet.has(`${line.year}-${line.month}`),
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
            isLinkedService: linkedServiceIds.has(link.otherServiceId),
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
  const summaries = flattened.map((row) => applySummaryMetrics(row));
  const showCounts = buildShowCounts(summaries, filters);

  return {
    notFound: false as const,
    clientId,
    client,
    filters,
    summaries,
    showCounts,
  };
}

function mergeUnmatchedByService<T extends {
  year: number;
  month: number;
  total: number;
  units: number;
  managerName?: string | null;
  managerUserId?: number | null;
  series?: string | null;
  albaran?: string | null;
  numero?: string | null;
}>(previous: T[], current: T[]) {
  if (previous.length === 0 || current.length === 0) {
    return { matches: [] as Array<{ previous: T; current: T }>, unmatchedPrevious: previous, unmatchedCurrent: current };
  }
  const previousAggregate = buildAggregateLine(previous);
  const currentAggregate = buildAggregateLine(current);
  return {
    matches: [{ previous: previousAggregate, current: currentAggregate }],
    unmatchedPrevious: [] as T[],
    unmatchedCurrent: [] as T[],
  };
}

function buildAggregateLine<T extends {
  year: number;
  month: number;
  total: number;
  units: number;
  managerName?: string | null;
  managerUserId?: string | number | null;
  series?: string | null;
  albaran?: string | null;
  numero?: string | null;
}>(lines: T[]): T {
  const latest = getLatestLine(lines);
  const total = lines.reduce((sum, line) => sum + line.total, 0);
  const units = lines.reduce((sum, line) => sum + line.units, 0);
  return {
    ...latest,
    total,
    units,
    series: null,
    albaran: null,
    numero: null,
  };
}

function getLatestLine<T extends { year: number; month: number }>(lines: T[]): T {
  return lines.reduce((latest, line) => {
    if (line.year > latest.year) return line;
    if (line.year === latest.year && line.month > latest.month) return line;
    return latest;
  }, lines[0]);
}

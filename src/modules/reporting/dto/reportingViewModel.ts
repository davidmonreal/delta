import type { MonthlyComparisonResult } from "../application/getMonthlyComparison";
import { buildPeriodQueryParams } from "../domain/periods";

export type ComparisonRowViewModel = {
  id: string;
  clientId: number;
  serviceId: number;
  title: string;
  subtitle?: string;
  href?: string;
  managerUserId?: number | null;
  managerName?: string | null;
  missingReason?: string;
  previousYear?: number | null;
  previousMonth?: number | null;
  currentYear?: number | null;
  currentMonth?: number | null;
  previousUnits: number;
  currentUnits: number;
  previousTotal: number;
  currentTotal: number;
  previousUnitPrice: number;
  currentUnitPrice: number;
  previousRef: string | null;
  currentRef: string | null;
  deltaPrice: number;
  isMissing: boolean;
  isNew: boolean;
  percentDelta?: number;
  hasComment: boolean;
  isLinkedService?: boolean;
};

export type MonthlyComparisonViewModel = {
  filters: MonthlyComparisonResult["filters"];
  summariesCount: number;
  showCounts: MonthlyComparisonResult["showCounts"];
  rows: ComparisonRowViewModel[];
};

export function toMonthlyComparisonViewModel(
  result: MonthlyComparisonResult,
): MonthlyComparisonViewModel {
  const { filters, summaries } = result;
  const periodParams = buildPeriodQueryParams(filters.periodA, filters.periodB);
  periodParams.set("rangeType", filters.rangeType);
  periodParams.set("show", filters.show);
  const periodQuery = periodParams.toString();

  return {
    filters,
    summariesCount: summaries.length,
    showCounts: result.showCounts,
    rows: summaries.map((row) => ({
      id: row.id,
      clientId: row.clientId,
      serviceId: row.serviceId,
      title: row.clientName,
      subtitle: row.managerName
        ? `${row.serviceName} - ${row.managerName}`
        : row.serviceName,
      href: `/client/${row.clientId}?${periodQuery}`,
      managerUserId: row.managerUserId ?? null,
      managerName: row.managerName ?? null,
      missingReason: row.missingReason,
      previousYear: row.previousYear ?? null,
      previousMonth: row.previousMonth ?? null,
      currentYear: row.currentYear ?? null,
      currentMonth: row.currentMonth ?? null,
      previousUnits: row.previousUnits,
      currentUnits: row.currentUnits,
      previousTotal: row.previousTotal,
      currentTotal: row.currentTotal,
      previousUnitPrice: row.previousUnitPrice,
      currentUnitPrice: row.currentUnitPrice,
      previousRef: row.previousRef,
      currentRef: row.currentRef,
      deltaPrice: row.deltaPrice,
      isMissing: row.isMissing,
      isNew: row.isNew ?? false,
      percentDelta: row.percentDelta,
      hasComment: false,
      isLinkedService: row.isLinkedService,
    })),
  };
}

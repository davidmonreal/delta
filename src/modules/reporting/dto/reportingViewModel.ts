import type { MonthlyComparisonResult } from "../application/getMonthlyComparison";

export type ComparisonRowViewModel = {
  id: string;
  clientId: number;
  serviceId: number;
  title: string;
  subtitle?: string;
  href?: string;
  managerUserId?: number | null;
  missingReason?: string;
  previousUnits: number;
  currentUnits: number;
  previousUnitPrice: number;
  currentUnitPrice: number;
  previousRef: string | null;
  currentRef: string | null;
  deltaPrice: number;
  isMissing: boolean;
  percentDelta?: number;
  hasComment: boolean;
};

export type MonthlyComparisonViewModel = {
  filters: MonthlyComparisonResult["filters"];
  summariesCount: number;
  showCounts: MonthlyComparisonResult["showCounts"];
  rows: ComparisonRowViewModel[];
  sumDeltaVisible: number;
};

export function toMonthlyComparisonViewModel(
  result: MonthlyComparisonResult,
): MonthlyComparisonViewModel {
  const { filters, summaries, sumDeltaVisible } = result;

  return {
    filters,
    summariesCount: summaries.length,
    showCounts: result.showCounts,
    sumDeltaVisible,
    rows: summaries.map((row) => ({
      id: row.id,
      clientId: row.clientId,
      serviceId: row.serviceId,
      title: row.clientName,
      subtitle: row.managerName
        ? `${row.serviceName} - ${row.managerName}`
        : row.serviceName,
      href: `/client/${row.clientId}?year=${filters.year}&month=${filters.month}&show=${filters.show}`,
      managerUserId: row.managerUserId ?? null,
      missingReason: row.missingReason,
      previousUnits: row.previousUnits,
      currentUnits: row.currentUnits,
      previousUnitPrice: row.previousUnitPrice,
      currentUnitPrice: row.currentUnitPrice,
      previousRef: row.previousRef,
      currentRef: row.currentRef,
      deltaPrice: row.deltaPrice,
      isMissing: row.isMissing,
      percentDelta: row.percentDelta,
      hasComment: false,
    })),
  };
}

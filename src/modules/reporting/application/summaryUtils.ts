import type { ResolvedFilters } from "./filters";

export type SummaryMetricsInput = {
  previousTotal: number;
  currentTotal: number;
  previousUnits: number;
  currentUnits: number;
};

export type SummaryMetrics = {
  previousUnitPrice: number;
  currentUnitPrice: number;
  deltaPrice: number;
  isMissing: boolean;
  isNew: boolean;
  percentDelta?: number;
};

export function applySummaryMetrics<T extends SummaryMetricsInput>(row: T): T & SummaryMetrics {
  const previousUnitPrice =
    row.previousUnits > 0 ? row.previousTotal / row.previousUnits : Number.NaN;
  const currentUnitPrice =
    row.currentUnits > 0 ? row.currentTotal / row.currentUnits : Number.NaN;
  const hasBoth = row.previousUnits > 0 && row.currentUnits > 0;
  const deltaPrice = hasBoth ? currentUnitPrice - previousUnitPrice : Number.NaN;
  const isMissing = row.previousUnits > 0 && row.currentUnits === 0;
  const isNew = row.previousUnits === 0 && row.currentUnits > 0;
  return {
    ...row,
    previousUnitPrice,
    currentUnitPrice,
    deltaPrice,
    isMissing,
    isNew,
    percentDelta:
      hasBoth && previousUnitPrice > 0
        ? ((currentUnitPrice - previousUnitPrice) / previousUnitPrice) * 100
        : undefined,
  };
}

export type SummaryFilterShape = {
  deltaPrice: number;
  isMissing: boolean;
  isNew: boolean;
};

export function filterSummaries<T extends SummaryFilterShape>(
  summaries: T[],
  filters: ResolvedFilters,
) {
  return summaries.filter((row) => {
    if (filters.showMissing) return row.isMissing;
    if (filters.showNew) return row.isNew;
    if (filters.showNegative)
      return !row.isMissing && !row.isNew && row.deltaPrice < -0.001;
    if (filters.showEqual)
      return !row.isMissing && !row.isNew && Math.abs(row.deltaPrice) <= 0.001;
    if (filters.showPositive)
      return !row.isMissing && !row.isNew && row.deltaPrice > 0.001;
    return !row.isMissing && !row.isNew && row.deltaPrice < -0.001;
  });
}

export function sortSummaries<T extends SummaryFilterShape & { percentDelta?: number }>(
  summaries: T[],
  filters: ResolvedFilters,
) {
  return summaries.slice().sort((a, b) => {
    if (filters.showPositive) {
      const aScore = a.percentDelta ?? Number.NEGATIVE_INFINITY;
      const bScore = b.percentDelta ?? Number.NEGATIVE_INFINITY;
      if (bScore !== aScore) return bScore - aScore;
    }

    const aScore = a.isMissing ? Number.POSITIVE_INFINITY : Math.abs(a.deltaPrice);
    const bScore = b.isMissing ? Number.POSITIVE_INFINITY : Math.abs(b.deltaPrice);
    return bScore - aScore;
  });
}

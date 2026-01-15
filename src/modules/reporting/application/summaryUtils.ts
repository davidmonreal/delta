import type { ResolvedFilters } from "./filters";

export type SummaryMetricsInput = {
  previousTotal: number;
  currentTotal: number;
  previousUnits: number;
  currentUnits: number;
  isMissing?: boolean;
  isNew?: boolean;
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
  const computedMissing = row.previousUnits > 0 && row.currentUnits === 0;
  const computedNew = row.previousUnits === 0 && row.currentUnits > 0;
  const isMissing = row.isMissing === true ? true : computedMissing;
  const isNew = row.isNew === true ? true : computedNew;
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
  percentDelta?: number;
};

export function filterSummaries<T extends SummaryFilterShape>(
  summaries: T[],
  filters: ResolvedFilters,
) {
  const percentFlags = [
    filters.showPercentUnder,
    filters.showPercentEqual,
    filters.showPercentOver,
  ];
  const hasPercentFilter = percentFlags.some(Boolean);
  const applyPercentFilter =
    filters.showPositive && hasPercentFilter && !percentFlags.every(Boolean);
  // Business rule: 3% is the expected annual increase; we treat it as "equal"
  // with a small tolerance to avoid rounding noise.
  const percentThreshold = 3;
  const percentTolerance = 0.1;

  return summaries.filter((row) => {
    if (filters.showMissing) return row.isMissing;
    if (filters.showNew) return row.isNew;
    const matchesShow =
      filters.showNegative
        ? !row.isMissing && !row.isNew && row.deltaPrice < -0.001
        : filters.showEqual
          ? !row.isMissing && !row.isNew && Math.abs(row.deltaPrice) <= 0.001
          : filters.showPositive
            ? !row.isMissing && !row.isNew && row.deltaPrice > 0.001
            : !row.isMissing && !row.isNew && row.deltaPrice < -0.001;

    if (!matchesShow) return false;
    if (filters.showPositive && !hasPercentFilter) return false;
    if (!applyPercentFilter) return true;
    if (row.percentDelta === undefined || Number.isNaN(row.percentDelta)) return false;

    const absPercent = Math.abs(row.percentDelta);
    const isUnder = absPercent < percentThreshold - percentTolerance;
    const isOver = absPercent > percentThreshold + percentTolerance;
    const isEqual = !isUnder && !isOver;

    return (
      (filters.showPercentUnder && isUnder) ||
      (filters.showPercentEqual && isEqual) ||
      (filters.showPercentOver && isOver)
    );
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

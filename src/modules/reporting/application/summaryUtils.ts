import type { ResolvedFilters } from "./filters";
import type { ShowFilter } from "../dto/reportingSchemas";

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

export type ShowCounts = {
  neg: number;
  eq: number;
  pos: number;
  miss: number;
  new: number;
};

const deltaThreshold = 0.001;
const percentThreshold = 3;
const percentTolerance = 0.1;

export function buildShowFilters(filters: ResolvedFilters, show: ShowFilter): ResolvedFilters {
  return {
    ...filters,
    show,
    showNegative: show === "neg",
    showEqual: show === "eq",
    showPositive: show === "pos",
    showMissing: show === "miss",
    showNew: show === "new",
  };
}

export function buildShowCounts<T extends SummaryFilterShape>(
  summaries: T[],
  filters: ResolvedFilters,
): ShowCounts {
  const counts: ShowCounts = { neg: 0, eq: 0, pos: 0, miss: 0, new: 0 };
  const percentFlags = [
    filters.showPercentUnder,
    filters.showPercentEqual,
    filters.showPercentOver,
  ];
  const hasPercentFilter = percentFlags.some(Boolean);
  const applyPercentFilter = hasPercentFilter && !percentFlags.every(Boolean);

  for (const row of summaries) {
    if (row.isMissing) {
      counts.miss += 1;
      continue;
    }
    if (row.isNew) {
      counts.new += 1;
      continue;
    }
    if (row.deltaPrice < -deltaThreshold) {
      counts.neg += 1;
      continue;
    }
    if (Math.abs(row.deltaPrice) <= deltaThreshold) {
      counts.eq += 1;
      continue;
    }
    if (row.deltaPrice > deltaThreshold) {
      if (!hasPercentFilter) continue;
      if (!applyPercentFilter) {
        counts.pos += 1;
        continue;
      }
      if (row.percentDelta === undefined || Number.isNaN(row.percentDelta)) continue;
      const absPercent = Math.abs(row.percentDelta);
      const isUnder = absPercent < percentThreshold - percentTolerance;
      const isOver = absPercent > percentThreshold + percentTolerance;
      const isEqual = !isUnder && !isOver;
      if (
        (filters.showPercentUnder && isUnder) ||
        (filters.showPercentEqual && isEqual) ||
        (filters.showPercentOver && isOver)
      ) {
        counts.pos += 1;
      }
    }
  }

  return counts;
}

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
  return summaries.filter((row) => {
    if (filters.showMissing) return row.isMissing;
    if (filters.showNew) return row.isNew;
    const matchesShow =
      filters.showNegative
        ? !row.isMissing && !row.isNew && row.deltaPrice < -deltaThreshold
        : filters.showEqual
          ? !row.isMissing && !row.isNew && Math.abs(row.deltaPrice) <= deltaThreshold
          : filters.showPositive
            ? !row.isMissing && !row.isNew && row.deltaPrice > deltaThreshold
            : !row.isMissing && !row.isNew && row.deltaPrice < -deltaThreshold;

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

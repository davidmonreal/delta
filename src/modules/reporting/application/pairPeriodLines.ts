import { pairLines } from "./pairLines";
import type { YearMonth } from "../ports/reportingRepository";

type PairingInput<T> = {
  previous: T[];
  current: T[];
  periodMonthsA: YearMonth[];
  periodMonthsB: YearMonth[];
  metric: "unit";
  tolerance: number;
};

type PairingResult<T> = {
  matches: Array<{ previous: T; current: T }>;
  unmatchedPrevious: T[];
  unmatchedCurrent: T[];
};

export function pairPeriodLines<T extends { year: number; month: number }>({
  previous,
  current,
  periodMonthsA,
  periodMonthsB,
  metric,
  tolerance,
}: PairingInput<T>): PairingResult<T> {
  const matches: Array<{ previous: T; current: T }> = [];
  const unmatchedPrevious: T[] = [];
  const unmatchedCurrent: T[] = [];
  const previousByMonth = groupByMonth(previous);
  const currentByMonth = groupByMonth(current);

  const monthPairs = periodMonthsA.map((month, index) => ({
    previousMonth: month,
    currentMonth: periodMonthsB[index] ?? periodMonthsB[periodMonthsB.length - 1],
  }));

  for (const { previousMonth, currentMonth } of monthPairs) {
    const previousLines = previousByMonth.get(keyForMonth(previousMonth)) ?? [];
    const currentLines = currentByMonth.get(keyForMonth(currentMonth)) ?? [];
    if (previousLines.length === 0 && currentLines.length === 0) continue;
    const pairing = pairLines({
      previous: previousLines,
      current: currentLines,
      metric,
      tolerance,
    });
    matches.push(...pairing.matches);
    unmatchedPrevious.push(...pairing.unmatchedPrevious);
    unmatchedCurrent.push(...pairing.unmatchedCurrent);
  }

  if (unmatchedPrevious.length === 0 && unmatchedCurrent.length === 0) {
    return { matches, unmatchedPrevious, unmatchedCurrent };
  }

  if (unmatchedPrevious.length === 0 || unmatchedCurrent.length === 0) {
    return { matches, unmatchedPrevious, unmatchedCurrent };
  }

  const fallback = pairLines({
    previous: unmatchedPrevious,
    current: unmatchedCurrent,
    metric,
    tolerance,
  });

  return {
    matches: [...matches, ...fallback.matches],
    unmatchedPrevious: fallback.unmatchedPrevious,
    unmatchedCurrent: fallback.unmatchedCurrent,
  };
}

function groupByMonth<T extends { year: number; month: number }>(rows: T[]) {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const key = `${row.year}-${row.month}`;
    const existing = map.get(key) ?? [];
    existing.push(row);
    map.set(key, existing);
  }
  return map;
}

function keyForMonth(month: YearMonth) {
  return `${month.year}-${month.month}`;
}

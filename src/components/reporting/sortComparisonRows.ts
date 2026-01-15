"use client";

import type { ComparisonRowViewModel } from "@/modules/reporting/dto/reportingViewModel";

export type SortKey = "client" | "delta" | "percent" | "comment";
export type SortDirection = "asc" | "desc";
export type SortState = { key: SortKey; direction: SortDirection } | null;

type Comparator = (a: ComparisonRowViewModel, b: ComparisonRowViewModel) => number;

function toSortableNumber(
  value: number | undefined,
  direction: SortDirection,
): number {
  if (value === undefined || Number.isNaN(value)) {
    return direction === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  }
  return value;
}

const comparators: Record<SortKey, Comparator> = {
  client: (a, b) => a.title.localeCompare(b.title, "ca"),
  delta: (a, b) => a.deltaPrice - b.deltaPrice,
  percent: (a, b) => (a.percentDelta ?? Number.NaN) - (b.percentDelta ?? Number.NaN),
  comment: (a, b) => Number(Boolean(a.hasComment)) - Number(Boolean(b.hasComment)),
};

export function sortComparisonRows(
  rows: ComparisonRowViewModel[],
  sortState: SortState,
): ComparisonRowViewModel[] {
  if (!sortState) return rows;
  const { key, direction } = sortState;
  const factor = direction === "asc" ? 1 : -1;
  const compare = comparators[key];

  const withIndex = rows.map((row, index) => ({ row, index }));
  return withIndex
    .sort((a, b) => {
      if (key === "delta") {
        const aValue = toSortableNumber(a.row.deltaPrice, direction);
        const bValue = toSortableNumber(b.row.deltaPrice, direction);
        if (aValue !== bValue) return (aValue - bValue) * factor;
      }

      if (key === "percent") {
        const aValue = toSortableNumber(a.row.percentDelta, direction);
        const bValue = toSortableNumber(b.row.percentDelta, direction);
        if (aValue !== bValue) return (aValue - bValue) * factor;
      }

      const value = compare(a.row, b.row);
      if (value !== 0) return value * factor;
      return a.index - b.index;
    })
    .map(({ row }) => row);
}

export function toggleSort(current: SortState, key: SortKey): SortState {
  if (current?.key === key) {
    return { key, direction: current.direction === "asc" ? "desc" : "asc" };
  }
  return {
    key,
    direction: key === "client" ? "asc" : "desc",
  };
}

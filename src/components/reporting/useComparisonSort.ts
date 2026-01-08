"use client";

import { useMemo, useState } from "react";

import type { ComparisonRowViewModel } from "@/modules/reporting/dto/reportingViewModel";

import {
  sortComparisonRows,
  toggleSort,
  type SortKey,
  type SortState,
} from "./sortComparisonRows";

export function useComparisonSort(rows: ComparisonRowViewModel[]) {
  const [sortState, setSortState] = useState<SortState>(null);
  const sortedRows = useMemo(
    () => sortComparisonRows(rows, sortState),
    [rows, sortState],
  );

  function handleSort(key: SortKey) {
    setSortState((current) => toggleSort(current, key));
  }

  return {
    sortState,
    sortedRows,
    handleSort,
  };
}

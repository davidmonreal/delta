"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { ComparisonRangeType, ShowFilter } from "@/modules/reporting/dto/reportingSchemas";
import type { ComparisonRowViewModel } from "@/modules/reporting/dto/reportingViewModel";
import type { FilterUserOption } from "@/modules/users/application/listUsersForFilter";
import {
  buildShowFilters,
  filterSummaries,
  sortSummaries,
} from "@/modules/reporting/application/summaryUtils";
import type { ShowCounts } from "@/modules/reporting/application/summaryUtils";
import AdminComparisonTable from "@/components/reporting/AdminComparisonTable";
import ComparisonTable from "@/components/reporting/ComparisonTable";
import ComparisonSummaryRow from "@/components/reporting/ComparisonSummaryRow";
import PercentFilterForm from "@/components/reporting/PercentFilterForm";
import ShowLinks from "@/components/reporting/ShowLinks";
import type { PeriodRange } from "@/modules/reporting/domain/periods";
import { expandPeriodMonths, formatPeriodLabel } from "@/modules/reporting/domain/periods";

type ComparisonResultsPanelProps = {
  rows: ComparisonRowViewModel[];
  showCounts: ShowCounts;
  baseHref: string;
  periodA: PeriodRange;
  periodB: PeriodRange;
  rangeType: ComparisonRangeType;
  initialShow: ShowFilter;
  showPercentUnder: boolean;
  showPercentEqual: boolean;
  showPercentOver: boolean;
  firstColumnLabel: string;
  enableAdminFilters?: boolean;
  subtitleLayout?: "service-manager" | "manager-only";
  summaryLabel?: string;
};

type CommentKey = {
  clientId: number;
  serviceId: number;
  year: number;
  month: number;
};

function buildBaseFilters({
  periodA,
  periodB,
  rangeType,
  showPercentUnder,
  showPercentEqual,
  showPercentOver,
}: {
  periodA: PeriodRange;
  periodB: PeriodRange;
  rangeType: ComparisonRangeType;
  showPercentUnder: boolean;
  showPercentEqual: boolean;
  showPercentOver: boolean;
}) {
  return {
    periodA,
    periodB,
    periodMonthsA: expandPeriodMonths(periodA),
    periodMonthsB: expandPeriodMonths(periodB),
    rangeType,
    show: "neg" as ShowFilter,
    showNegative: false,
    showEqual: false,
    showPositive: false,
    showMissing: false,
    showNew: false,
    showPercentUnder,
    showPercentEqual,
    showPercentOver,
  };
}

export default function ComparisonResultsPanel({
  rows,
  showCounts,
  baseHref,
  periodA,
  periodB,
  rangeType,
  initialShow,
  showPercentUnder,
  showPercentEqual,
  showPercentOver,
  firstColumnLabel,
  enableAdminFilters = false,
  subtitleLayout,
  summaryLabel = "Total diferència (preu unitari)",
}: ComparisonResultsPanelProps) {
  const [activeShow, setActiveShow] = useState<ShowFilter>(initialShow);
  const [commentKeys, setCommentKeys] = useState<Set<string> | null>(null);
  const [users, setUsers] = useState<FilterUserOption[]>([]);

  useEffect(() => {
    setActiveShow(initialShow);
  }, [initialShow]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const current = url.searchParams.get("show");
    if (current === activeShow) return;
    url.searchParams.set("show", activeShow);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [activeShow]);

  const handleCommentCreated = useCallback(
    (clientId: number, serviceId: number, year: number, month: number) => {
      setCommentKeys((prev) => {
        const next = new Set(prev ?? []);
        next.add(`${clientId}-${serviceId}-${year}-${month}`);
        return next;
      });
    },
    [],
  );

  const baseFilters = useMemo(
    () =>
      buildBaseFilters({
        periodA,
        periodB,
        rangeType,
        showPercentUnder,
        showPercentEqual,
        showPercentOver,
      }),
    [
      periodA,
      periodB,
      rangeType,
      showPercentEqual,
      showPercentOver,
      showPercentUnder,
    ],
  );

  const activeFilters = useMemo(
    () => buildShowFilters(baseFilters, activeShow),
    [activeShow, baseFilters],
  );

  const commentParams = useMemo(() => {
    const clientIds = Array.from(new Set(rows.map((row) => row.clientId)));
    const serviceIds = Array.from(new Set(rows.map((row) => row.serviceId)));
    const monthMap = new Map<string, { year: number; month: number }>();
    for (const row of rows) {
      if (row.previousYear && row.previousMonth) {
        monthMap.set(`${row.previousYear}-${row.previousMonth}`, {
          year: row.previousYear,
          month: row.previousMonth,
        });
      }
      if (row.currentYear && row.currentMonth) {
        monthMap.set(`${row.currentYear}-${row.currentMonth}`, {
          year: row.currentYear,
          month: row.currentMonth,
        });
      }
    }
    const months = Array.from(monthMap.values());
    return {
      clientIds,
      serviceIds,
      months,
      key: `${clientIds.join(",")}-${serviceIds.join(",")}-${months
        .map((entry) => `${entry.year}-${entry.month}`)
        .join(",")}`,
    };
  }, [rows]);

  useEffect(() => {
    if (
      commentParams.clientIds.length === 0 ||
      commentParams.serviceIds.length === 0 ||
      commentParams.months.length === 0
    ) {
      setCommentKeys(new Set());
      return;
    }
    let active = true;
    const loadComments = async () => {
      const response = await fetch("/api/comments/contexts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          months: commentParams.months,
          clientIds: commentParams.clientIds,
          serviceIds: commentParams.serviceIds,
        }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as { keys: CommentKey[] };
      if (!active) return;
      const nextSet = new Set(
        data.keys.map(
          (key) => `${key.clientId}-${key.serviceId}-${key.year}-${key.month}`,
        ),
      );
      setCommentKeys(nextSet);
    };
    loadComments();
    return () => {
      active = false;
    };
  }, [commentParams.key, commentParams.clientIds, commentParams.serviceIds, commentParams.months]);

  useEffect(() => {
    if (!enableAdminFilters) return;
    let active = true;
    const loadUsers = async () => {
      const response = await fetch("/api/users/filter");
      if (!response.ok) return;
      const data = (await response.json()) as { users: FilterUserOption[] };
      if (!active) return;
      setUsers(data.users);
    };
    loadUsers();
    return () => {
      active = false;
    };
  }, [enableAdminFilters]);

  const rowsWithComments = useMemo(() => {
    if (!commentKeys) return rows;
    return rows.map((row) => ({
      ...row,
      hasComment: Boolean(
        (row.currentYear &&
          row.currentMonth &&
          commentKeys.has(
            `${row.clientId}-${row.serviceId}-${row.currentYear}-${row.currentMonth}`,
          )) ||
          (row.previousYear &&
            row.previousMonth &&
            commentKeys.has(
              `${row.clientId}-${row.serviceId}-${row.previousYear}-${row.previousMonth}`,
            )),
      ),
    }));
  }, [commentKeys, rows]);

  const rowsWithActiveHref = useMemo(() => {
    if (!activeShow) return rowsWithComments;
    return rowsWithComments.map((row) => {
      if (!row.href) return row;
      const url = new URL(row.href, "http://placeholder");
      url.searchParams.set("show", activeShow);
      return { ...row, href: `${url.pathname}${url.search}` };
    });
  }, [activeShow, rowsWithComments]);

  const filteredRows = useMemo(
    () =>
      sortSummaries(
        filterSummaries(rowsWithActiveHref, activeFilters),
        activeFilters,
      ),
    [activeFilters, rowsWithActiveHref],
  );

  const sumDeltaVisible = useMemo(
    () =>
      filteredRows.reduce(
        (total, row) => total + (row.currentTotal - row.previousTotal),
        0,
      ),
    [filteredRows],
  );

  const showPositive = activeFilters.showPositive;
  const showEqual = activeFilters.showEqual;
  const showMissing = activeFilters.showMissing;
  const showNew = activeFilters.showNew;
  const showNegative = activeFilters.showNegative;

  const headerLabel = showEqual
    ? "Resultats amb preu unitari igual"
    : "Resultats per preu unitari";
  const headerSuffix = showNegative ? " negatives" : "";

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 text-sm text-slate-500 lg:flex-row lg:items-start lg:justify-between">
        <span className="text-base font-semibold text-slate-700">
          {headerLabel}
          {headerSuffix}
        </span>
        <div className="flex flex-col items-end gap-2">
          <ShowLinks
            baseHref={baseHref}
            periodA={periodA}
            periodB={periodB}
            rangeType={rangeType}
            activeShow={activeShow}
            showPercentUnder={showPercentUnder}
            showPercentEqual={showPercentEqual}
            showPercentOver={showPercentOver}
            showCounts={showCounts}
            onShowChange={setActiveShow}
          />
          {showPositive ? (
            <PercentFilterForm
              baseHref={baseHref}
              periodA={periodA}
              periodB={periodB}
              rangeType={rangeType}
              show={activeShow}
              showPercentUnder={showPercentUnder}
              showPercentEqual={showPercentEqual}
              showPercentOver={showPercentOver}
            />
          ) : null}
        </div>
      </div>
      {enableAdminFilters ? (
        <AdminComparisonTable
          rows={filteredRows}
          users={users}
          periodALabel={formatPeriodLabel(periodA)}
          periodBLabel={formatPeriodLabel(periodB)}
          showPositive={showPositive}
          showEqual={showEqual}
          showMissing={showMissing}
          showNew={showNew}
          firstColumnLabel={firstColumnLabel}
          currentFirst
          onCommentCreated={handleCommentCreated}
        />
      ) : (
        <ComparisonTable
          rows={filteredRows}
          periodALabel={formatPeriodLabel(periodA)}
          periodBLabel={formatPeriodLabel(periodB)}
          showPositive={showPositive}
          showEqual={showEqual}
          showMissing={showMissing}
          showNew={showNew}
          firstColumnLabel={firstColumnLabel}
          subtitleLayout={subtitleLayout}
          currentFirst
          onCommentCreated={handleCommentCreated}
        />
      )}
      <ComparisonSummaryRow
        label={summaryLabel}
        value={sumDeltaVisible}
        showPositive={showPositive}
      />
    </>
  );
}

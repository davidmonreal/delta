"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatCurrency, formatPercent, formatUnits } from "@/lib/format";
import type { ComparisonRowViewModel } from "@/modules/reporting/dto/reportingViewModel";
import ComparisonRowComment from "@/components/reporting/ComparisonRowComment";
import { useComparisonSort } from "@/components/reporting/useComparisonSort";
import type { SortKey } from "@/components/reporting/sortComparisonRows";
import PaginationControls from "@/components/common/PaginationControls";

type ComparisonTableProps = {
  rows: ComparisonRowViewModel[];
  previousYear: number;
  year: number;
  month: number;
  showPositive: boolean;
  showEqual: boolean;
  showMissing: boolean;
  showNew: boolean;
  firstColumnLabel: string;
};

export default function ComparisonTable({
  rows,
  previousYear,
  year,
  month,
  showPositive,
  showEqual,
  showMissing,
  showNew,
  firstColumnLabel,
}: ComparisonTableProps) {
  const { sortState, sortedRows, handleSort } = useComparisonSort(rows);
  const pageSize = 20;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = sortedRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const gridClass = showPositive
    ? "grid-cols-[2fr_repeat(4,minmax(140px,1fr))_90px]"
    : "grid-cols-[2fr_repeat(3,minmax(140px,1fr))_90px]";
  const disableDeltaSort = showEqual || showMissing || showNew;

  useEffect(() => {
    setPage(1);
  }, [rows, sortState?.key, sortState?.direction]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const renderSubtitle = (subtitle?: string) => {
    if (!subtitle) return null;
    const parts = subtitle.split(" - ").map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return (
        <>
          <span className="mt-1 block text-xs text-slate-500">{parts[0]}</span>
          <span className="mt-1 block text-xs text-slate-400">{parts[1]}</span>
        </>
      );
    }
    return <span className="mt-1 block text-xs text-slate-500">{subtitle}</span>;
  };

  const renderUnitsInfo = (units: number, unitPrice: number, ref: string | null) => {
    const unitLabel = units === 1 ? "1 unitat" : `${formatUnits(units)} unitats`;
    return (
      <div className="text-right tabular-nums">
        <span className="block">{formatCurrency(unitPrice)}</span>
        <span className="mt-1 block text-xs text-slate-400">{ref ?? "-"}</span>
        <span className="mt-1 block text-xs text-slate-500">{unitLabel}</span>
      </div>
    );
  };

  function renderSortLabel(label: string, key: SortKey) {
    const isActive = sortState?.key === key;
    const arrow = isActive ? (sortState?.direction === "asc" ? "↑" : "↓") : "↕";
    return (
      <button
        type="button"
        onClick={() => handleSort(key)}
        className="flex items-center gap-1 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 hover:text-slate-500"
      >
        <span>{label}</span>
        <span className="text-[10px] tracking-normal">{arrow}</span>
      </button>
    );
  }

  return (
    <div className="grid gap-3">
      <div
        className={`grid items-center gap-4 rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 ${gridClass}`}
      >
        {renderSortLabel(firstColumnLabel, "client")}
        <span className="text-right">Serveis {previousYear}</span>
        <span className="text-right">Serveis {year}</span>
        <span className="flex justify-end">
          {disableDeltaSort ? (
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Delta preu
            </span>
          ) : (
            renderSortLabel("Delta preu", "delta")
          )}
        </span>
        {showPositive ? (
          <span className="flex justify-end">
            {renderSortLabel("Augment %", "percent")}
          </span>
        ) : null}
        <span className="text-right">Comentari</span>
      </div>
      {pagedRows.map((row) => (
        <div
          key={row.id}
          className={`grid items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 ${gridClass}`}
        >
          <div>
            {row.href ? (
              <Link
                href={row.href}
                className="block font-medium hover:text-emerald-700"
              >
                {row.title}
              </Link>
            ) : (
              <span className="block font-medium">{row.title}</span>
            )}
            {renderSubtitle(row.subtitle)}
          </div>
          {renderUnitsInfo(row.previousUnits, row.previousUnitPrice, row.previousRef)}
          {renderUnitsInfo(row.currentUnits, row.currentUnitPrice, row.currentRef)}
          <span
            className={`text-right font-semibold tabular-nums ${
              row.isMissing || row.deltaPrice < 0
                ? "text-red-600"
                : "text-emerald-700"
            }`}
          >
            {row.isMissing ? "No fet" : formatCurrency(row.deltaPrice)}
          </span>
          {showPositive ? (
            <span className="text-right tabular-nums">
              {formatPercent(row.percentDelta ?? Number.NaN)}
            </span>
          ) : null}
          <div className="flex justify-end">
            <ComparisonRowComment
              clientId={row.clientId}
              serviceId={row.serviceId}
              year={year}
              month={month}
              title={row.title}
              subtitle={row.subtitle}
            />
          </div>
        </div>
      ))}
      <PaginationControls
        page={currentPage}
        totalItems={sortedRows.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}

"use client";

import Link from "next/link";

import { formatCurrency, formatPercent, formatUnits } from "@/lib/format";
import type { ComparisonRowViewModel } from "@/modules/reporting/dto/reportingViewModel";
import ComparisonRowComment from "@/components/reporting/ComparisonRowComment";
import { useComparisonSort } from "@/components/reporting/useComparisonSort";
import type { SortKey } from "@/components/reporting/sortComparisonRows";

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
  const gridClass = showPositive
    ? "grid-cols-[2fr_repeat(4,minmax(140px,1fr))_90px]"
    : "grid-cols-[2fr_repeat(3,minmax(140px,1fr))_90px]";
  const disableDeltaSort = showEqual || showMissing || showNew;

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
      {sortedRows.map((row) => (
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
            {row.subtitle ? (
              <span className="mt-1 block text-xs text-slate-500">
                {row.subtitle}
              </span>
            ) : null}
          </div>
          <span className="text-right tabular-nums">
            <span className="block">
              {formatUnits(row.previousUnits)} - {formatCurrency(row.previousUnitPrice)}
            </span>
            <span className="mt-1 block text-xs text-slate-400">
              {row.previousRef ?? "-"}
            </span>
          </span>
          <span className="text-right tabular-nums">
            <span className="block">
              {formatUnits(row.currentUnits)} - {formatCurrency(row.currentUnitPrice)}
            </span>
            <span className="mt-1 block text-xs text-slate-400">
              {row.currentRef ?? "-"}
            </span>
          </span>
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
    </div>
  );
}

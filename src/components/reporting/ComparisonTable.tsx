import Link from "next/link";

import { formatCurrency, formatPercent, formatUnits } from "@/lib/format";
import ComparisonRowComment from "@/components/reporting/ComparisonRowComment";

type ComparisonRow = {
  id: string;
  clientId: number;
  serviceId: number;
  title: string;
  subtitle?: string;
  href?: string;
  previousUnits: number;
  currentUnits: number;
  previousUnitPrice: number;
  currentUnitPrice: number;
  previousRef: string | null;
  currentRef: string | null;
  deltaPrice: number;
  isMissing: boolean;
  percentDelta?: number;
};

type ComparisonTableProps = {
  rows: ComparisonRow[];
  previousYear: number;
  year: number;
  month: number;
  showPositive: boolean;
  firstColumnLabel: string;
};

export default function ComparisonTable({
  rows,
  previousYear,
  year,
  month,
  showPositive,
  firstColumnLabel,
}: ComparisonTableProps) {
  const gridClass = showPositive
    ? "grid-cols-[2fr_repeat(4,minmax(140px,1fr))_90px]"
    : "grid-cols-[2fr_repeat(3,minmax(140px,1fr))_90px]";

  return (
    <div className="grid gap-3">
      <div
        className={`grid items-center gap-4 rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 ${gridClass}`}
      >
        <span>{firstColumnLabel}</span>
        <span className="text-right">Serveis {previousYear}</span>
        <span className="text-right">Serveis {year}</span>
        <span className="text-right">Delta preu</span>
        {showPositive ? <span className="text-right">Augment %</span> : null}
        <span className="text-right">Comentari</span>
      </div>
      {rows.map((row) => (
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

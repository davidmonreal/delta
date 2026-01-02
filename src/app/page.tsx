import Link from "next/link";

import { formatCurrency, formatPercent, formatUnits } from "@/lib/format";
import { requireSession } from "@/lib/require-auth";
import { PrismaReportingRepository } from "@/modules/reporting/infrastructure/prismaReportingRepository";
import { getMonthlyComparison } from "@/modules/reporting/application/getMonthlyComparison";
import { toMonthlyComparisonDto } from "@/modules/reporting/dto/reportingDto";
import FiltersForm from "@/components/reporting/FiltersForm";
import ShowLinks from "@/components/reporting/ShowLinks";

type SearchParams = {
  year?: string;
  month?: string;
  show?: string;
};

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  await requireSession();
  const repo = new PrismaReportingRepository();
  const { filters, summaries, visibleRows, negativeMissing, sumDeltaVisible, sumDeltaMissing } =
    toMonthlyComparisonDto(
      await getMonthlyComparison({
        repo,
        rawFilters: {
          year: resolvedSearchParams.year,
          month: resolvedSearchParams.month,
          show: resolvedSearchParams.show,
        },
      }),
    );
  const { year, month, previousYear, show, showEqual, showNegative, showPositive } =
    filters;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-4">
            <img src="/logo-busbac.png" alt="Busbac" className="h-16 w-auto" />
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
              Comparativa mensual
            </p>
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
            Diferencies per client i servei
          </h1>
          <p className="mt-2 text-base text-slate-500">
            Comparant {month}/{previousYear} amb {month}/{year}
          </p>
        </div>
        <FiltersForm year={year} month={month} show={show} />
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>
            {showEqual
              ? "Resultats amb preu unitari igual"
              : "Resultats per preu unitari"}{" "}
            ({summaries.length})
            {showNegative ? " negatives" : ""}
          </span>
          <ShowLinks baseHref="/" year={year} month={month} />
        </div>
        <div className="grid gap-3">
          <div
            className={`grid items-center gap-4 rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 ${
              showPositive
                ? "grid-cols-[2fr_repeat(4,minmax(140px,1fr))]"
                : "grid-cols-[2fr_repeat(3,minmax(140px,1fr))]"
            }`}
          >
            <span>Client</span>
            <span className="text-right">Serveis {previousYear}</span>
            <span className="text-right">Serveis {year}</span>
            <span className="text-right">Delta preu</span>
            {showPositive ? <span className="text-right">Augment %</span> : null}
          </div>
          {visibleRows.map((row) => (
            <div
              key={`${row.clientId}-${row.serviceId}`}
              className={`grid items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 ${
                showPositive
                  ? "grid-cols-[2fr_repeat(4,minmax(140px,1fr))]"
                  : "grid-cols-[2fr_repeat(3,minmax(140px,1fr))]"
              }`}
            >
              <div>
                <Link
                  href={`/client/${row.clientId}?year=${year}&month=${month}`}
                  className="block font-medium hover:text-emerald-700"
                >
                  {row.clientName}
                </Link>
                <span className="mt-1 block text-xs text-slate-500">
                  {row.serviceName}
                </span>
              </div>
              <span className="text-right tabular-nums">
                <span className="block">
                  {formatUnits(row.previousUnits)} -{" "}
                  {formatCurrency(row.previousUnitPrice)}
                </span>
                <span className="mt-1 block text-xs text-slate-400">
                  {row.previousRef ?? "-"}
                </span>
              </span>
              <span className="text-right tabular-nums">
                <span className="block">
                  {formatUnits(row.currentUnits)} -{" "}
                  {formatCurrency(row.currentUnitPrice)}
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
            </div>
          ))}
          <div
            className={`grid items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 ${
              showPositive
                ? "grid-cols-[2fr_repeat(4,minmax(140px,1fr))]"
                : "grid-cols-[2fr_repeat(3,minmax(140px,1fr))]"
            }`}
          >
            <span>Total diferencia (preu unitari)</span>
            <span />
            <span className="text-right tabular-nums">{formatCurrency(sumDeltaVisible)}</span>
            <span />
            {showPositive ? <span /> : null}
          </div>
        </div>
        {showNegative && negativeMissing.length > 0 ? (
          <div className="mt-6 grid gap-3">
            <div
              className={`grid items-center gap-4 rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 ${
                showPositive
                  ? "grid-cols-[2fr_repeat(4,minmax(140px,1fr))]"
                  : "grid-cols-[2fr_repeat(3,minmax(140px,1fr))]"
              }`}
            >
              <span>No fets</span>
              <span className="text-right">Serveis {previousYear}</span>
              <span className="text-right">Serveis {year}</span>
              <span className="text-right">Delta preu</span>
              {showPositive ? <span className="text-right">Augment %</span> : null}
            </div>
            {negativeMissing.map((row) => (
              <div
                key={`${row.clientId}-${row.serviceId}`}
                className={`grid items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 ${
                  showPositive
                    ? "grid-cols-[2fr_repeat(4,minmax(140px,1fr))]"
                    : "grid-cols-[2fr_repeat(3,minmax(140px,1fr))]"
                }`}
              >
                <div>
                  <Link
                    href={`/client/${row.clientId}?year=${year}&month=${month}`}
                    className="block font-medium hover:text-emerald-700"
                  >
                    {row.clientName}
                  </Link>
                  <span className="mt-1 block text-xs text-slate-500">
                    {row.serviceName}
                  </span>
                </div>
                <span className="text-right tabular-nums">
                  <span className="block">
                    {formatUnits(row.previousUnits)} -{" "}
                    {formatCurrency(row.previousUnitPrice)}
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">
                    {row.previousRef ?? "-"}
                  </span>
                </span>
                <span className="text-right text-slate-400">
                  {formatUnits(row.currentUnits)} -{" "}
                  {formatCurrency(row.currentUnitPrice)}
                </span>
                <span className="text-right font-semibold text-red-600">No fet</span>
                {showPositive ? <span className="text-right text-slate-400">-</span> : null}
              </div>
            ))}
            <div
              className={`grid items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 ${
                showPositive
                  ? "grid-cols-[2fr_repeat(4,minmax(140px,1fr))]"
                  : "grid-cols-[2fr_repeat(3,minmax(140px,1fr))]"
              }`}
            >
              <span>Total diferencia (no fets)</span>
              <span />
              <span className="text-right tabular-nums">{formatCurrency(sumDeltaMissing)}</span>
              <span />
              {showPositive ? <span /> : null}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

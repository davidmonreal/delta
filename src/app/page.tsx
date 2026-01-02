import Link from "next/link";

import { requireSession } from "@/lib/require-auth";
import { PrismaReportingRepository } from "@/modules/reporting/infrastructure/prismaReportingRepository";
import { getMonthlyComparison } from "@/modules/reporting/application/getMonthlyComparison";
import { toMonthlyComparisonDto } from "@/modules/reporting/dto/reportingDto";
import FiltersForm from "@/components/reporting/FiltersForm";
import ShowLinks from "@/components/reporting/ShowLinks";
import ComparisonTable from "@/components/reporting/ComparisonTable";
import ComparisonSummaryRow from "@/components/reporting/ComparisonSummaryRow";

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
        <ComparisonTable
          rows={visibleRows.map((row) => ({
            id: `${row.clientId}-${row.serviceId}`,
            title: row.clientName,
            subtitle: row.serviceName,
            href: `/client/${row.clientId}?year=${year}&month=${month}`,
            previousUnits: row.previousUnits,
            currentUnits: row.currentUnits,
            previousUnitPrice: row.previousUnitPrice,
            currentUnitPrice: row.currentUnitPrice,
            previousRef: row.previousRef,
            currentRef: row.currentRef,
            deltaPrice: row.deltaPrice,
            isMissing: row.isMissing,
            percentDelta: row.percentDelta,
          }))}
          previousYear={previousYear}
          year={year}
          showPositive={showPositive}
          firstColumnLabel="Client"
        />
        <ComparisonSummaryRow
          label="Total diferencia (preu unitari)"
          value={sumDeltaVisible}
          showPositive={showPositive}
        />
        {showNegative && negativeMissing.length > 0 ? (
          <div className="mt-6 grid gap-3">
            <ComparisonTable
              rows={negativeMissing.map((row) => ({
                id: `${row.clientId}-${row.serviceId}`,
                title: row.clientName,
                subtitle: row.serviceName,
                href: `/client/${row.clientId}?year=${year}&month=${month}`,
                previousUnits: row.previousUnits,
                currentUnits: row.currentUnits,
                previousUnitPrice: row.previousUnitPrice,
                currentUnitPrice: row.currentUnitPrice,
                previousRef: row.previousRef,
                currentRef: row.currentRef,
                deltaPrice: row.deltaPrice,
                isMissing: row.isMissing,
                percentDelta: row.percentDelta,
              }))}
              previousYear={previousYear}
              year={year}
              showPositive={showPositive}
              firstColumnLabel="No fets"
            />
            <ComparisonSummaryRow
              label="Total diferencia (no fets)"
              value={sumDeltaMissing}
              showPositive={showPositive}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

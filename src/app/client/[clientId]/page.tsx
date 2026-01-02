import Link from "next/link";
import { notFound } from "next/navigation";

import { requireSession } from "@/lib/require-auth";
import { PrismaReportingRepository } from "@/modules/reporting/infrastructure/prismaReportingRepository";
import { getClientComparison } from "@/modules/reporting/application/getClientComparison";
import { toClientComparisonDto } from "@/modules/reporting/dto/reportingDto";
import FiltersForm from "@/components/reporting/FiltersForm";
import ShowLinks from "@/components/reporting/ShowLinks";
import ComparisonTable from "@/components/reporting/ComparisonTable";
import ComparisonSummaryRow from "@/components/reporting/ComparisonSummaryRow";

type SearchParams = {
  year?: string;
  month?: string;
  show?: string;
};

export default async function ClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  await requireSession();
  const repo = new PrismaReportingRepository();
  const result = toClientComparisonDto(
    await getClientComparison({
      repo,
      rawFilters: {
        year: resolvedSearchParams.year,
        month: resolvedSearchParams.month,
        show: resolvedSearchParams.show,
      },
      rawClientId: resolvedParams.clientId,
    }),
  );
  if (result.notFound) {
    notFound();
  }

  const { clientId, client, filters, summaries, sumDeltaVisible } = result;
  const { year, month, previousYear, show, showEqual, showNegative, showPositive } =
    filters;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-4">
            <img src="/logo-busbac.png" alt="Busbac" className="h-16 w-auto" />
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
              <Link href="/" className="hover:text-emerald-700">
                &lt;- Tornar a la vista principal
              </Link>
            </p>
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
            {client.nameRaw}
          </h1>
          <p className="mt-2 text-base text-slate-500">
            Diferencies per servei ({month}/{previousYear} vs {month}/{year})
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
          <ShowLinks
            baseHref={`/client/${clientId}`}
            year={year}
            month={month}
            activeShow={show}
          />
        </div>
        <ComparisonTable
          rows={summaries.map((row) => ({
            id: String(row.serviceId),
            title: row.serviceName,
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
          firstColumnLabel="Servei"
        />
        <ComparisonSummaryRow
          label="Total diferencia"
          value={sumDeltaVisible}
          showPositive={showPositive}
        />
      </section>
    </div>
  );
}

import { requireSession } from "@/lib/require-auth";
import { isAdminRole } from "@/modules/users/domain/rolePolicies";
import { PrismaReportingRepository } from "@/modules/reporting/infrastructure/prismaReportingRepository";
import { getMonthlyComparisonPage } from "@/modules/reporting/application/getMonthlyComparisonPage";
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
  const session = await requireSession();
  const managerUserId = isAdminRole(session.user.role)
    ? undefined
    : Number.parseInt(session.user.id, 10);
  const repo = new PrismaReportingRepository();
  const { filters, rows, summariesCount, sumDeltaVisible } =
    await getMonthlyComparisonPage({
      repo,
      rawFilters: {
        year: resolvedSearchParams.year,
        month: resolvedSearchParams.month,
        show: resolvedSearchParams.show,
      },
      managerUserId: Number.isNaN(managerUserId) ? undefined : managerUserId,
    });
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
            ({summariesCount})
            {showNegative ? " negatives" : ""}
          </span>
          <ShowLinks baseHref="/" year={year} month={month} activeShow={show} />
        </div>
        <ComparisonTable
          rows={rows}
          previousYear={previousYear}
          year={year}
          month={month}
          showPositive={showPositive}
          showEqual={showEqual}
          showMissing={filters.showMissing}
          showNew={filters.showNew}
          firstColumnLabel="Client"
        />
        <ComparisonSummaryRow
          label="Total diferencia (preu unitari)"
          value={sumDeltaVisible}
          showPositive={showPositive}
        />
      </section>
    </div>
  );
}

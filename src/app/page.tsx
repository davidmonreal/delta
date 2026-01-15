import Image from "next/image";

import { requireSession } from "@/lib/require-auth";
import { isAdminRole } from "@/modules/users/domain/rolePolicies";
import { PrismaReportingRepository } from "@/modules/reporting/infrastructure/prismaReportingRepository";
import { getMonthlyComparisonPage } from "@/modules/reporting/application/getMonthlyComparisonPage";
import { PrismaLinkedServiceRepository } from "@/modules/linkedServices/infrastructure/prismaLinkedServiceRepository";
import FiltersForm from "@/components/reporting/FiltersForm";
import ComparisonResultsPanel from "@/components/reporting/ComparisonResultsPanel";

type SearchParams = {
  year?: string | string[];
  month?: string | string[];
  show?: string | string[];
  pctUnder?: string | string[];
  pctEqual?: string | string[];
  pctOver?: string | string[];
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
  const linkedServiceRepo = new PrismaLinkedServiceRepository();
  const { filters, rows, showCounts } =
    await getMonthlyComparisonPage({
      repo,
      linkedServiceRepo,
      viewerRole: session.user.role,
      rawFilters: {
        year: resolvedSearchParams.year,
        month: resolvedSearchParams.month,
        show: resolvedSearchParams.show,
        pctUnder: resolvedSearchParams.pctUnder,
        pctEqual: resolvedSearchParams.pctEqual,
        pctOver: resolvedSearchParams.pctOver,
      },
      managerUserId: Number.isNaN(managerUserId) ? undefined : managerUserId,
    });
  await linkedServiceRepo.disconnect?.();
  const {
    year,
    month,
    previousYear,
    show,
    showPercentUnder,
    showPercentEqual,
    showPercentOver,
  } = filters;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Image
              src="/logo-busbac.png"
              alt="Busbac"
              width={128}
              height={64}
              className="h-16 w-auto"
              priority
            />
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
              Comparativa mensual
            </p>
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
            Diferències per client i servei
          </h1>
          <p className="mt-2 text-base text-slate-500">
            Comparant {month}/{previousYear} amb {month}/{year}
          </p>
        </div>
        <FiltersForm year={year} month={month} show={show} />
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <ComparisonResultsPanel
          rows={rows}
          showCounts={showCounts}
          baseHref="/"
          year={year}
          month={month}
          previousYear={previousYear}
          initialShow={show}
          showPercentUnder={showPercentUnder}
          showPercentEqual={showPercentEqual}
          showPercentOver={showPercentOver}
          firstColumnLabel="Client"
          enableAdminFilters={isAdminRole(session.user.role)}
        />
      </section>
    </div>
  );
}

import { requireSession } from "@/lib/require-auth";
import { isAdminRole } from "@/modules/users/domain/rolePolicies";
import { PrismaReportingRepository } from "@/modules/reporting/infrastructure/prismaReportingRepository";
import { getMonthlyComparisonPage } from "@/modules/reporting/application/getMonthlyComparisonPage";
import { PrismaCommentRepository } from "@/modules/comments/infrastructure/prismaCommentRepository";
import { getCommentedContexts } from "@/modules/comments/application/getCommentedContexts";
import { PrismaUserRepository } from "@/modules/users/infrastructure/prismaUserRepository";
import { listUsersForFilter } from "@/modules/users/application/listUsersForFilter";
import { PrismaLinkedServiceRepository } from "@/modules/linkedServices/infrastructure/prismaLinkedServiceRepository";
import FiltersForm from "@/components/reporting/FiltersForm";
import ShowLinks from "@/components/reporting/ShowLinks";
import ComparisonTable from "@/components/reporting/ComparisonTable";
import ComparisonSummaryRow from "@/components/reporting/ComparisonSummaryRow";
import PercentFilterForm from "@/components/reporting/PercentFilterForm";
import AdminComparisonTable from "@/components/reporting/AdminComparisonTable";

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
  const { filters, rows, summariesCount, sumDeltaVisible } =
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
    showEqual,
    showNegative,
    showPositive,
    showPercentUnder,
    showPercentEqual,
    showPercentOver,
  } = filters;
  const commentRepo = new PrismaCommentRepository();
  const clientIds = Array.from(new Set(rows.map((row) => row.clientId)));
  const serviceIds = Array.from(new Set(rows.map((row) => row.serviceId)));
  const { keys: commentKeys } = await getCommentedContexts({
    repo: commentRepo,
    sessionUser: session.user,
    year,
    month,
    clientIds,
    serviceIds,
  });
  await commentRepo.disconnect?.();
  const commentSet = new Set(
    commentKeys.map((key) => `${key.clientId}-${key.serviceId}`),
  );
  const rowsWithComments = rows.map((row) => ({
    ...row,
    hasComment: commentSet.has(`${row.clientId}-${row.serviceId}`),
  }));
  const userRepo = new PrismaUserRepository();
  const filterUsers = await listUsersForFilter({
    sessionUser: session.user,
    repo: userRepo,
  });
  await userRepo.disconnect?.();

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
            Diferències per client i servei
          </h1>
          <p className="mt-2 text-base text-slate-500">
            Comparant {month}/{previousYear} amb {month}/{year}
          </p>
        </div>
        <FiltersForm year={year} month={month} show={show} />
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 text-sm text-slate-500 lg:flex-row lg:items-start lg:justify-between">
          <span className="text-base font-semibold text-slate-700">
            {showEqual
              ? "Resultats amb preu unitari igual"
              : "Resultats per preu unitari"}{" "}
            ({summariesCount})
            {showNegative ? " negatives" : ""}
          </span>
          <div className="flex flex-col items-end gap-2">
            <ShowLinks
              baseHref="/"
              year={year}
              month={month}
              activeShow={show}
              showPercentUnder={showPercentUnder}
              showPercentEqual={showPercentEqual}
              showPercentOver={showPercentOver}
            />
            {showPositive ? (
              <PercentFilterForm
                baseHref="/"
                year={year}
                month={month}
                show={show}
                showPercentUnder={showPercentUnder}
                showPercentEqual={showPercentEqual}
                showPercentOver={showPercentOver}
              />
            ) : null}
          </div>
        </div>
        {isAdminRole(session.user.role) ? (
          <AdminComparisonTable
            rows={rowsWithComments}
            users={filterUsers}
            previousYear={previousYear}
            year={year}
            month={month}
            showPositive={showPositive}
            showEqual={showEqual}
            showMissing={filters.showMissing}
            showNew={filters.showNew}
            firstColumnLabel="Client"
          />
        ) : (
          <ComparisonTable
            rows={rowsWithComments}
            previousYear={previousYear}
            year={year}
            month={month}
            showPositive={showPositive}
            showEqual={showEqual}
            showMissing={filters.showMissing}
            showNew={filters.showNew}
            firstColumnLabel="Client"
          />
        )}
        <ComparisonSummaryRow
          label="Total diferència (preu unitari)"
          value={sumDeltaVisible}
          showPositive={showPositive}
        />
      </section>
    </div>
  );
}

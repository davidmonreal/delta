import Image from "next/image";
import { notFound } from "next/navigation";

import { requireSession } from "@/lib/require-auth";
import { isAdminRole } from "@/modules/users/domain/rolePolicies";
import { PrismaReportingRepository } from "@/modules/reporting/infrastructure/prismaReportingRepository";
import { getClientComparison } from "@/modules/reporting/application/getClientComparison";
import { getClientInvoiceLines } from "@/modules/reporting/application/getClientInvoiceLines";
import { toClientComparisonDto } from "@/modules/reporting/dto/reportingDto";
import { monthLabels } from "@/modules/reporting/domain/monthLabels";
import { PrismaLinkedServiceRepository } from "@/modules/linkedServices/infrastructure/prismaLinkedServiceRepository";
import FiltersForm from "@/components/reporting/FiltersForm";
import ComparisonResultsPanel from "@/components/reporting/ComparisonResultsPanel";
import ClientInvoiceGroups from "@/components/reporting/ClientInvoiceGroups";

type SearchParams = {
  year?: string | string[];
  month?: string | string[];
  show?: string | string[];
  pctUnder?: string | string[];
  pctEqual?: string | string[];
  pctOver?: string | string[];
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
  const session = await requireSession();
  const managerUserId = isAdminRole(session.user.role)
    ? undefined
    : Number.parseInt(session.user.id, 10);
  const repo = new PrismaReportingRepository();
  const linkedServiceRepo = new PrismaLinkedServiceRepository();
  const result = toClientComparisonDto(
    await getClientComparison({
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
      rawClientId: resolvedParams.clientId,
      managerUserId: Number.isNaN(managerUserId) ? undefined : managerUserId,
    }),
  );
  await linkedServiceRepo.disconnect?.();
  if (result.notFound) {
    notFound();
  }

  const { clientId, client, filters, summaries, showCounts } = result;
  const invoiceGroups = await getClientInvoiceLines({
    repo,
    clientId,
    managerUserId: Number.isNaN(managerUserId) ? undefined : managerUserId,
  });
  const {
    year,
    month,
    previousYear,
    show,
    showPercentUnder,
    showPercentEqual,
    showPercentOver,
  } = filters;
  const rowsWithComments = summaries.map((row) => ({
    id: row.id,
    clientId,
    serviceId: row.serviceId,
    title: row.serviceName,
    subtitle: row.managerName ?? undefined,
    managerUserId: row.managerUserId ?? null,
    missingReason: row.missingReason,
    previousUnits: row.previousUnits,
    currentUnits: row.currentUnits,
    previousTotal: row.previousTotal,
    currentTotal: row.currentTotal,
    previousUnitPrice: row.previousUnitPrice,
    currentUnitPrice: row.currentUnitPrice,
    previousRef: row.previousRef,
    currentRef: row.currentRef,
    deltaPrice: row.deltaPrice,
    isMissing: row.isMissing,
    isNew: row.isNew ?? false,
    percentDelta: row.percentDelta,
    hasComment: false,
  }));

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
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
            {client.nameRaw}
          </h1>
          <p className="mt-2 text-base text-slate-500">
            Diferències per servei ({month}/{previousYear} vs {month}/{year})
          </p>
        </div>
        <FiltersForm year={year} month={month} show={show} />
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <ComparisonResultsPanel
          rows={rowsWithComments}
          showCounts={showCounts}
          baseHref={`/client/${clientId}`}
          year={year}
          month={month}
          previousYear={previousYear}
          initialShow={show}
          showPercentUnder={showPercentUnder}
          showPercentEqual={showPercentEqual}
          showPercentOver={showPercentOver}
          firstColumnLabel="Servei"
          subtitleLayout="manager-only"
          summaryLabel="Total diferència"
        />
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Altres factures per mes
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Detall per línia de les altres factures del client.
            </p>
          </div>
        </div>
        {invoiceGroups.length === 0 ? (
          <p className="text-sm text-slate-500">No hi ha línies per mostrar.</p>
        ) : (
          <ClientInvoiceGroups groups={invoiceGroups} monthLabels={monthLabels} />
        )}
      </section>
    </div>
  );
}

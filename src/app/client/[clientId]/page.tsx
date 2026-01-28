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
import { formatPeriodLabel } from "@/modules/reporting/domain/periods";
import { getAvailableMonths } from "@/modules/reporting/application/getAvailableMonths";

type SearchParams = {
  year?: string | string[];
  month?: string | string[];
  aStartYear?: string | string[];
  aStartMonth?: string | string[];
  aEndYear?: string | string[];
  aEndMonth?: string | string[];
  bStartYear?: string | string[];
  bStartMonth?: string | string[];
  bEndYear?: string | string[];
  bEndMonth?: string | string[];
  rangeType?: string | string[];
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
        aStartYear: resolvedSearchParams.aStartYear,
        aStartMonth: resolvedSearchParams.aStartMonth,
        aEndYear: resolvedSearchParams.aEndYear,
        aEndMonth: resolvedSearchParams.aEndMonth,
        bStartYear: resolvedSearchParams.bStartYear,
        bStartMonth: resolvedSearchParams.bStartMonth,
        bEndYear: resolvedSearchParams.bEndYear,
        bEndMonth: resolvedSearchParams.bEndMonth,
        rangeType: resolvedSearchParams.rangeType,
        show: resolvedSearchParams.show,
        pctUnder: resolvedSearchParams.pctUnder,
        pctEqual: resolvedSearchParams.pctEqual,
        pctOver: resolvedSearchParams.pctOver,
      },
      rawClientId: resolvedParams.clientId,
      managerUserId: Number.isNaN(managerUserId) ? undefined : managerUserId,
    }),
  );
  const linkedServiceLinks = await linkedServiceRepo.listLinks();
  const linkedServiceIds = new Set<number>();
  for (const link of linkedServiceLinks) {
    linkedServiceIds.add(link.serviceId);
    linkedServiceIds.add(link.linkedServiceId);
  }
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
  const highlightedInvoiceGroups = invoiceGroups.map((group) => ({
    ...group,
    lines: group.lines.map((line) => ({
      ...line,
      isLinkedService: linkedServiceIds.has(line.serviceId),
    })),
  }));
  const {
    periodA,
    periodB,
    rangeType,
    show,
    showPercentUnder,
    showPercentEqual,
    showPercentOver,
  } = filters;
  const availableMonths = await getAvailableMonths({
    repo,
    managerUserId: Number.isNaN(managerUserId) ? undefined : managerUserId,
    clientId,
  });
  const periodALabel = formatPeriodLabel(periodA);
  const periodBLabel = formatPeriodLabel(periodB);
  const rowsWithComments = summaries.map((row) => ({
    id: row.id,
    clientId,
    serviceId: row.serviceId,
    title: row.serviceName,
    subtitle: row.managerName ?? undefined,
    managerUserId: row.managerUserId ?? null,
    managerName: row.managerName ?? null,
    missingReason: row.missingReason,
    previousYear: row.previousYear ?? null,
    previousMonth: row.previousMonth ?? null,
    currentYear: row.currentYear ?? null,
    currentMonth: row.currentMonth ?? null,
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
    isLinkedService: linkedServiceIds.has(row.serviceId),
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
            Diferències per servei ({periodBLabel} vs {periodALabel})
          </p>
        </div>
        <FiltersForm
          periodA={periodA}
          periodB={periodB}
          rangeType={rangeType}
          availableMonths={availableMonths}
          show={show}
        />
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <ComparisonResultsPanel
          rows={rowsWithComments}
          showCounts={showCounts}
          baseHref={`/client/${clientId}`}
          periodA={periodA}
          periodB={periodB}
          rangeType={rangeType}
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
        {highlightedInvoiceGroups.length === 0 ? (
          <p className="text-sm text-slate-500">No hi ha línies per mostrar.</p>
        ) : (
          <ClientInvoiceGroups
            groups={highlightedInvoiceGroups}
            monthLabels={monthLabels}
          />
        )}
      </section>
    </div>
  );
}

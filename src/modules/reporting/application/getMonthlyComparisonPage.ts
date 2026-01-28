import type { ReportingQueryRepository } from "../ports/reportingRepository";
import type { LinkedServiceRepository } from "@/modules/linkedServices/ports/linkedServiceRepository";
import type { UserRole } from "@/modules/users/domain/userRole";
import { toMonthlyComparisonViewModel } from "../dto/reportingViewModel";
import { getMonthlyComparison } from "./getMonthlyComparison";

export async function getMonthlyComparisonPage({
  repo,
  linkedServiceRepo,
  viewerRole,
  rawFilters,
  managerUserId,
}: {
  repo: ReportingQueryRepository;
  linkedServiceRepo?: LinkedServiceRepository;
  viewerRole?: UserRole;
  rawFilters: {
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
  managerUserId?: number;
}) {
  const result = await getMonthlyComparison({
    repo,
    linkedServiceRepo,
    viewerRole,
    rawFilters,
    managerUserId,
  });

  return toMonthlyComparisonViewModel(result);
}

import type { ReportingRepository } from "../ports/reportingRepository";
import { toMonthlyComparisonViewModel } from "../dto/reportingViewModel";
import { getMonthlyComparison } from "./getMonthlyComparison";

export async function getMonthlyComparisonPage({
  repo,
  rawFilters,
  managerUserId,
}: {
  repo: ReportingRepository;
  rawFilters: {
    year?: string | string[];
    month?: string | string[];
    show?: string | string[];
    pctUnder?: string | string[];
    pctEqual?: string | string[];
    pctOver?: string | string[];
  };
  managerUserId?: number;
}) {
  const result = await getMonthlyComparison({
    repo,
    rawFilters,
    managerUserId,
  });

  return toMonthlyComparisonViewModel(result);
}

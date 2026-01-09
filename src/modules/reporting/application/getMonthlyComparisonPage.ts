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
    year?: string;
    month?: string;
    show?: string;
    pctUnder?: string;
    pctEqual?: string;
    pctOver?: string;
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

import type { ReportingQueryRepository, YearMonth } from "../ports/reportingRepository";

export async function getAvailableMonths({
  repo,
  managerUserId,
  clientId,
}: {
  repo: ReportingQueryRepository;
  managerUserId?: number;
  clientId?: number;
}): Promise<YearMonth[]> {
  return repo.getAvailableMonths({ managerUserId, clientId });
}

import type { ManagerCandidate, ManagerMatcher } from "../domain/managerMatcher";
import { defaultManagerMatcher } from "../domain/managerMatcher";
import type { UnmatchedInvoiceLine } from "../ports/invoiceRepository";

export function suggestManagers({
  lines,
  userCandidates,
  matcher = defaultManagerMatcher,
}: {
  lines: UnmatchedInvoiceLine[];
  userCandidates: ManagerCandidate[];
  matcher?: ManagerMatcher;
}) {
  // Business rule: suggest the most recent manager on the client line when possible,
  // but never auto-assign; the admin must confirm.
  if (userCandidates.length === 0) return lines;

  const cacheByClientId = new Map<number, number | null>();

  return lines.map((line) => {
    if (line.suggestedUserId) {
      cacheByClientId.set(line.clientId, line.suggestedUserId);
      return line;
    }
    const cached = cacheByClientId.get(line.clientId);
    if (cached !== undefined) {
      return cached ? { ...line, suggestedUserId: cached } : line;
    }

    const candidateName = line.recentManagerName ?? line.manager;
    if (!candidateName.trim()) {
      cacheByClientId.set(line.clientId, null);
      return line;
    }
    const match = matcher.match(candidateName, userCandidates);
    cacheByClientId.set(line.clientId, match.userId ?? null);
    if (!match.userId) return line;
    return { ...line, suggestedUserId: match.userId };
  });
}

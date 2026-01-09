import { matchUserId } from "@/lib/match-user";

import type { UnmatchedInvoiceLine } from "../ports/invoiceRepository";

type UserCandidate = {
  id: number;
  nameNormalized: string;
};

export function suggestManagers({
  lines,
  userCandidates,
}: {
  lines: UnmatchedInvoiceLine[];
  userCandidates: UserCandidate[];
}) {
  // Business rule: suggest the most recent manager on the client line when possible,
  // but never auto-assign; the admin must confirm.
  if (userCandidates.length === 0) return lines;

  return lines.map((line) => {
    if (line.suggestedUserId) return line;
    const candidateName = line.recentManagerName ?? line.manager;
    if (!candidateName.trim()) return line;
    const match = matchUserId(candidateName, userCandidates);
    if (!match.userId) return line;
    return { ...line, suggestedUserId: match.userId };
  });
}

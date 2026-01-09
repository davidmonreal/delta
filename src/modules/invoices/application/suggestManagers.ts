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

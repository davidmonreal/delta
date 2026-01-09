import { buildUserCandidates } from "@/modules/users/application/buildUserCandidates";
import { suggestManagers } from "./suggestManagers";
import type { InvoiceRepository } from "../ports/invoiceRepository";
import type { UserRepository } from "@/modules/users/ports/userRepository";

/**
 * Prepare unmatched invoice lines for the admin upload screen.
 * We attach suggestions only when explicitly requested to keep manual review clear.
 */
export async function getUnmatchedAssignments({
  invoiceRepo,
  userRepo,
  suggestionsEnabled,
}: {
  invoiceRepo: InvoiceRepository;
  userRepo: UserRepository;
  suggestionsEnabled: boolean;
}) {
  const [lines, users] = await Promise.all([
    invoiceRepo.listUnmatched(),
    userRepo.listAll(),
  ]);
  const userCandidates = buildUserCandidates(users);
  const resolvedLines = suggestionsEnabled
    ? suggestManagers({ lines, userCandidates })
    : lines.map((line) => ({ ...line, suggestedUserId: null }));

  return {
    lines: resolvedLines,
    users,
  };
}

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
  const users = await userRepo.listAll();
  const aliasAssignments = users.flatMap((user) =>
    (user.managerAliases ?? [])
      .map((alias) => alias.alias.trim())
      .filter((alias) => alias.length > 0)
      .map((alias) => ({ alias, userId: user.id })),
  );

  if (aliasAssignments.length > 0) {
    const uniqueAssignments = new Map<string, number>();
    for (const { alias, userId } of aliasAssignments) {
      if (!uniqueAssignments.has(alias)) {
        uniqueAssignments.set(alias, userId);
      }
    }

    // Ensure alias-based assignments are applied before listing unmatched lines.
    for (const [alias, userId] of uniqueAssignments) {
      await invoiceRepo.assignManagerAlias(alias, userId);
    }
  }

  const lines = await invoiceRepo.listUnmatched();
  const userCandidates = buildUserCandidates(users);
  const resolvedLines = suggestionsEnabled
    ? suggestManagers({ lines, userCandidates })
    : lines.map((line) => ({ ...line, suggestedUserId: null }));

  return {
    lines: resolvedLines,
    users,
  };
}

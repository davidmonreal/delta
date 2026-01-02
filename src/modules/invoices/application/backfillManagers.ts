import type { InvoiceRepository } from "../ports/invoiceRepository";

export async function backfillManagers({
  repo,
  userCandidates,
}: {
  repo: InvoiceRepository;
  userCandidates: { id: number; nameNormalized: string }[];
}) {
  return repo.backfillManagers({ userCandidates });
}

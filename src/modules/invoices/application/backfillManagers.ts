import type { BackfillProgress, InvoiceRepository } from "../ports/invoiceRepository";

export async function backfillManagers({
  repo,
  userCandidates,
  onProgress,
}: {
  repo: InvoiceRepository;
  userCandidates: { id: number; nameNormalized: string }[];
  onProgress?: (progress: BackfillProgress) => Promise<void> | void;
}) {
  return repo.backfillManagers({ userCandidates, onProgress });
}

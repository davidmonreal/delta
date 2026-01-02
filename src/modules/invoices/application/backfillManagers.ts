import type { InvoiceRepository } from "../ports/invoiceRepository";

export async function backfillManagers({
  repo,
  userLookup,
}: {
  repo: InvoiceRepository;
  userLookup: Map<string, number>;
}) {
  return repo.backfillManagers({ userLookup });
}

import type { InvoiceRepository } from "../ports/invoiceRepository";

export async function listDuplicates({
  repo,
  limit,
}: {
  repo: InvoiceRepository;
  limit?: number;
}) {
  return repo.listDuplicates(limit);
}

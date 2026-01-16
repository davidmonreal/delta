import type { InvoiceQueryRepository } from "../ports/invoiceRepository";

export async function listUnmatched({ repo }: { repo: InvoiceQueryRepository }) {
  return repo.listUnmatched();
}

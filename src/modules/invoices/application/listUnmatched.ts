import type { InvoiceRepository } from "../ports/invoiceRepository";

export async function listUnmatched({ repo }: { repo: InvoiceRepository }) {
  return repo.listUnmatched();
}

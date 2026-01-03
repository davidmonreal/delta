import type { InvoiceRepository } from "../ports/invoiceRepository";

export async function deleteDuplicates({ repo }: { repo: InvoiceRepository }) {
  return repo.deleteDuplicates();
}

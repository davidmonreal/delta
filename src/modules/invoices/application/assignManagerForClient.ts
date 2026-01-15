import type { InvoiceRepository } from "../ports/invoiceRepository";

export async function assignManagerForClient({
  repo,
  clientId,
  userId,
}: {
  repo: InvoiceRepository;
  clientId: number;
  userId: number;
}) {
  return repo.assignManagerForClient({ clientId, userId });
}

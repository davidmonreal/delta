import type { InvoiceCommandRepository } from "../ports/invoiceRepository";

export async function assignManagerForClient({
  repo,
  clientId,
  userId,
}: {
  repo: InvoiceCommandRepository;
  clientId: number;
  userId: number;
}) {
  return repo.assignManagerForClient({ clientId, userId });
}

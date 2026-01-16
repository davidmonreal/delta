import type { InvoiceCommandRepository } from "../ports/invoiceRepository";

export async function assignManager({
  repo,
  lineId,
  userId,
}: {
  repo: InvoiceCommandRepository;
  lineId: number;
  userId: number;
}) {
  await repo.assignManager(lineId, userId);
}

import type { InvoiceRepository } from "../ports/invoiceRepository";

export async function assignManager({
  repo,
  lineId,
  userId,
}: {
  repo: InvoiceRepository;
  lineId: number;
  userId: number;
}) {
  await repo.assignManager(lineId, userId);
}

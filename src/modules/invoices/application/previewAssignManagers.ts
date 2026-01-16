import type { InvoiceQueryRepository } from "../ports/invoiceRepository";

export async function previewAssignManagers({
  repo,
  nameNormalized,
}: {
  repo: InvoiceQueryRepository;
  nameNormalized: string;
}) {
  return repo.countUnassignedByManagerName({ nameNormalized });
}

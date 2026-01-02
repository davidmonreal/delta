import type { InvoiceRepository } from "../ports/invoiceRepository";

export async function previewAssignManagers({
  repo,
  nameNormalized,
}: {
  repo: InvoiceRepository;
  nameNormalized: string;
}) {
  return repo.countUnassignedByManagerName({ nameNormalized });
}

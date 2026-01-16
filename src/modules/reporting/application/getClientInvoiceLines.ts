import type { ReportingQueryRepository } from "../ports/reportingRepository";

export type ClientInvoiceLineItem = {
  id: number;
  date: Date;
  total: number;
  units: number;
  serviceName: string;
  managerName: string | null;
  series: string | null;
  albaran: string | null;
  numero: string | null;
};

export type ClientInvoiceLineGroup = {
  year: number;
  month: number;
  lines: ClientInvoiceLineItem[];
};

export async function getClientInvoiceLines({
  repo,
  clientId,
  managerUserId,
}: {
  repo: ReportingQueryRepository;
  clientId: number;
  managerUserId?: number;
}): Promise<ClientInvoiceLineGroup[]> {
  const lines = await repo.getClientInvoiceLines({ clientId, managerUserId });
  const groups = new Map<string, ClientInvoiceLineGroup>();

  for (const line of lines) {
    const key = `${line.year}-${line.month}`;
    const existing =
      groups.get(key) ??
      ({
        year: line.year,
        month: line.month,
        lines: [],
      } satisfies ClientInvoiceLineGroup);
    existing.lines.push({
      id: line.id,
      date: line.date,
      total: line.total,
      units: line.units,
      serviceName: line.serviceName,
      managerName: line.managerName,
      series: line.series,
      albaran: line.albaran,
      numero: line.numero,
    });
    groups.set(key, existing);
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}

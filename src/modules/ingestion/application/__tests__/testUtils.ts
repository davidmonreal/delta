import type { IngestionRepository, InvoiceLineInput } from "../../ports/ingestionRepository";

export class InMemoryIngestionRepository implements IngestionRepository {
  clients = new Map<string, number>();
  services = new Map<string, number>();
  invoiceLines: InvoiceLineInput[] = [];
  private clientId = 1;
  private serviceId = 1;

  async upsertClient(nameRaw: string, nameNormalized: string) {
    const existing = this.clients.get(nameNormalized);
    if (existing) return existing;
    const id = this.clientId++;
    this.clients.set(nameNormalized, id);
    return id;
  }

  async upsertService(conceptRaw: string, conceptNormalized: string) {
    const existing = this.services.get(conceptNormalized);
    if (existing) return existing;
    const id = this.serviceId++;
    this.services.set(conceptNormalized, id);
    return id;
  }

  async findClientsByNormalized(names: string[]) {
    return names
      .map((nameNormalized) => {
        const id = this.clients.get(nameNormalized);
        return id ? { id, nameNormalized } : null;
      })
      .filter((entry): entry is { id: number; nameNormalized: string } => entry !== null);
  }

  async findServicesByNormalized(names: string[]) {
    return names
      .map((conceptNormalized) => {
        const id = this.services.get(conceptNormalized);
        return id ? { id, conceptNormalized } : null;
      })
      .filter(
        (entry): entry is { id: number; conceptNormalized: string } => entry !== null,
      );
  }

  async createClients(entries: { nameRaw: string; nameNormalized: string }[]) {
    for (const entry of entries) {
      if (!this.clients.has(entry.nameNormalized)) {
        this.clients.set(entry.nameNormalized, this.clientId++);
      }
    }
  }

  async createServices(entries: { conceptRaw: string; conceptNormalized: string }[]) {
    for (const entry of entries) {
      if (!this.services.has(entry.conceptNormalized)) {
        this.services.set(entry.conceptNormalized, this.serviceId++);
      }
    }
  }

  async deleteInvoiceLinesBySourceFile(sourceFile: string) {
    this.invoiceLines = this.invoiceLines.filter(
      (line) => line.sourceFile !== sourceFile,
    );
  }

  async createInvoiceLines(lines: InvoiceLineInput[]) {
    this.invoiceLines.push(...lines);
    return lines.length;
  }

  async getImportSummary(sourceFile: string) {
    const rows = this.invoiceLines.filter((line) => line.sourceFile === sourceFile);
    const assigned = rows.filter((line) => line.managerUserId !== null).length;

    return {
      total: rows.length,
      assigned,
      unmatched: rows.length - assigned,
    };
  }
}

export type InvoiceLineInput = {
  date: Date;
  year: number;
  month: number;
  units: number;
  price: number;
  total: number;
  manager: string;
  managerNormalized: string | null;
  sourceFile: string;
  series: string | null;
  albaran: string | null;
  numero: string | null;
  clientId: number;
  serviceId: number;
  managerUserId: number | null;
};

export type ImportSummary = {
  total: number;
  assigned: number;
  unmatched: number;
};

export interface IngestionRepository {
  upsertClient(nameRaw: string, nameNormalized: string): Promise<number>;
  upsertService(conceptRaw: string, conceptNormalized: string): Promise<number>;
  findClientsByNormalized(
    names: string[],
  ): Promise<{ id: number; nameNormalized: string }[]>;
  findServicesByNormalized(
    names: string[],
  ): Promise<{ id: number; conceptNormalized: string }[]>;
  createClients(entries: { nameRaw: string; nameNormalized: string }[]): Promise<void>;
  createServices(
    entries: { conceptRaw: string; conceptNormalized: string }[],
  ): Promise<void>;
  deleteInvoiceLinesBySourceFile(sourceFile: string): Promise<void>;
  createInvoiceLines(lines: InvoiceLineInput[]): Promise<number>;
  getImportSummary(sourceFile: string): Promise<ImportSummary>;
  disconnect?: () => Promise<void>;
}

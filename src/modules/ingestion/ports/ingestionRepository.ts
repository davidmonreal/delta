export type InvoiceLineInput = {
  date: Date;
  year: number;
  month: number;
  units: number;
  price: number;
  total: number;
  manager: string;
  sourceFile: string;
  series: string | null;
  albaran: string | null;
  numero: string | null;
  clientId: number;
  serviceId: number;
};

export interface IngestionRepository {
  upsertClient(nameRaw: string, nameNormalized: string): Promise<number>;
  upsertService(conceptRaw: string, conceptNormalized: string): Promise<number>;
  deleteInvoiceLinesBySourceFile(sourceFile: string): Promise<void>;
  createInvoiceLines(lines: InvoiceLineInput[]): Promise<number>;
}

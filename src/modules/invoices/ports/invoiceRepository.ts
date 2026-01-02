export type UnmatchedInvoiceLine = {
  id: number;
  date: Date;
  manager: string;
  managerNormalized: string | null;
  clientName: string;
  serviceName: string;
  total: number;
};

export interface InvoiceRepository {
  listUnmatched(): Promise<UnmatchedInvoiceLine[]>;
  assignManager(lineId: number, userId: number): Promise<void>;
  backfillManagers(params: { userLookup: Map<string, number> }): Promise<number>;
  disconnect?: () => Promise<void>;
}

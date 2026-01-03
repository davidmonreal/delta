export type UnmatchedInvoiceLine = {
  id: number;
  date: Date;
  manager: string;
  managerNormalized: string | null;
  clientName: string;
  serviceName: string;
  total: number;
  suggestedUserId?: number | null;
};

export type DuplicateInvoiceGroup = {
  key: string;
  count: number;
  date: Date;
  manager: string;
  clientName: string;
  serviceName: string;
  total: number;
  series: string | null;
  albaran: string | null;
  numero: string | null;
};

export interface InvoiceRepository {
  listUnmatched(): Promise<UnmatchedInvoiceLine[]>;
  assignManager(lineId: number, userId: number): Promise<void>;
  assignManagersForUser(params: {
    userId: number;
    nameNormalized: string;
  }): Promise<number>;
  countUnassignedByManagerName(params: { nameNormalized: string }): Promise<number>;
  listDuplicates(limit?: number): Promise<DuplicateInvoiceGroup[]>;
  deleteDuplicates(): Promise<number>;
  backfillManagers(params: {
    userCandidates: { id: number; nameNormalized: string }[];
  }): Promise<number>;
  disconnect?: () => Promise<void>;
}

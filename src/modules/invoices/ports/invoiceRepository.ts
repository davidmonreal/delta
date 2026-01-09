export type UnmatchedInvoiceLine = {
  id: number;
  date: Date;
  manager: string;
  managerNormalized: string | null;
  clientId: number;
  clientName: string;
  serviceName: string;
  total: number;
  suggestedUserId?: number | null;
  recentManagerName?: string | null;
};

export type BackfillProgress = {
  processed: number;
  total: number;
};

export interface InvoiceRepository {
  listUnmatched(): Promise<UnmatchedInvoiceLine[]>;
  assignManager(lineId: number, userId: number): Promise<void>;
  assignManagersForUser(params: {
    userId: number;
    nameNormalized: string;
  }): Promise<number>;
  countUnassignedByManagerName(params: { nameNormalized: string }): Promise<number>;
  backfillManagers(params: {
    userCandidates: { id: number; nameNormalized: string }[];
    onProgress?: (progress: BackfillProgress) => Promise<void> | void;
  }): Promise<number>;
  disconnect?: () => Promise<void>;
}

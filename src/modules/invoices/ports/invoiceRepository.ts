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

export type BackfillInvoiceLine = {
  id: number;
  manager: string;
  managerNormalized: string | null;
  managerUserId: number | null;
};

export type ManagerAssignmentUpdate = {
  ids: number[];
  managerUserId: number | null;
  managerNormalized: string;
};

export type ManagerNormalizationUpdate = {
  ids: number[];
  managerNormalized: string;
};

export type BackfillProgress = {
  processed: number;
  total: number;
};

export interface InvoiceQueryRepository {
  listUnmatched(): Promise<UnmatchedInvoiceLine[]>;
  countUnassignedByManagerName(params: { nameNormalized: string }): Promise<number>;
  listBackfillLines(): Promise<BackfillInvoiceLine[]>;
  listUnmatchedManagers(query: string): Promise<string[]>;
}

export interface InvoiceCommandRepository {
  assignManager(lineId: number, userId: number): Promise<void>;
  assignManagerForClient(params: { clientId: number; userId: number }): Promise<number>;
  assignManagersForUser(params: {
    userId: number;
    nameNormalized: string;
  }): Promise<number>;
  updateManagerAssignments(params: { updates: ManagerAssignmentUpdate[] }): Promise<void>;
  updateManagerNormalized(params: {
    updates: ManagerNormalizationUpdate[];
  }): Promise<void>;
  // Manager aliases
  assignManagerAlias(alias: string, userId: number): Promise<void>;
}

export interface InvoiceRepository
  extends InvoiceQueryRepository,
  InvoiceCommandRepository {
  disconnect?: () => Promise<void>;
}

export type YearMonth = {
  year: number;
  month: number;
};

export type MonthlyGroupRow = {
  clientId: number;
  serviceId: number;
  year: number;
  month: number;
  total: number | null;
  units: number | null;
};

export type ClientGroupRow = {
  serviceId: number;
  year: number;
  month: number;
  total: number | null;
  units: number | null;
};

export type MonthlyRefRow = {
  clientId: number;
  serviceId: number;
  year: number;
  month: number;
  series: string | null;
  albaran: string | null;
  numero: string | null;
};

export type MonthlyManagerRow = {
  clientId: number;
  serviceId: number;
  year: number;
  month: number;
  managerName: string | null;
};

export type MonthlyLineRow = {
  clientId: number;
  serviceId: number;
  year: number;
  month: number;
  total: number;
  units: number;
  series: string | null;
  albaran: string | null;
  numero: string | null;
  managerName: string | null;
};

export type ClientManagerRow = {
  serviceId: number;
  year: number;
  month: number;
  managerName: string | null;
};

export type ClientLineRow = {
  serviceId: number;
  year: number;
  month: number;
  total: number;
  units: number;
  series: string | null;
  albaran: string | null;
  numero: string | null;
  managerName: string | null;
};
export type ClientRefRow = {
  serviceId: number;
  year: number;
  month: number;
  series: string | null;
  albaran: string | null;
  numero: string | null;
};

export type ClientInvoiceLineRow = {
  id: number;
  year: number;
  month: number;
  date: Date;
  total: number;
  units: number;
  serviceId: number;
  serviceName: string;
  managerName: string | null;
  series: string | null;
  albaran: string | null;
  numero: string | null;
};

export type ClientRow = {
  id: number;
  nameRaw: string;
};

export type ServiceRow = {
  id: number;
  conceptRaw: string;
};

export interface ReportingRepository {
  getLatestEntry(params?: { managerUserId?: number }): Promise<YearMonth | null>;
  getLatestEntryForClient(
    clientId: number,
    params?: { managerUserId?: number },
  ): Promise<YearMonth | null>;
  getMonthlyGroups(params: {
    years: number[];
    month: number;
    managerUserId?: number;
  }): Promise<MonthlyGroupRow[]>;
  getMonthlyRefs(params: {
    years: number[];
    month: number;
    managerUserId?: number;
  }): Promise<MonthlyRefRow[]>;
  getMonthlyManagers(params: {
    years: number[];
    month: number;
    managerUserId?: number;
  }): Promise<MonthlyManagerRow[]>;
  getMonthlyLines(params: {
    years: number[];
    month: number;
    managerUserId?: number;
  }): Promise<MonthlyLineRow[]>;
  getClientsByIds(ids: number[]): Promise<ClientRow[]>;
  getServicesByIds(ids: number[]): Promise<ServiceRow[]>;
  getClientById(id: number): Promise<ClientRow | null>;
  getClientGroups(params: {
    clientId: number;
    years: number[];
    month: number;
    managerUserId?: number;
  }): Promise<ClientGroupRow[]>;
  getClientRefs(params: {
    clientId: number;
    years: number[];
    month: number;
    managerUserId?: number;
  }): Promise<ClientRefRow[]>;
  getClientManagers(params: {
    clientId: number;
    years: number[];
    month: number;
    managerUserId?: number;
  }): Promise<ClientManagerRow[]>;
  getClientLines(params: {
    clientId: number;
    years: number[];
    month: number;
    managerUserId?: number;
  }): Promise<ClientLineRow[]>;
  getClientInvoiceLines(params: {
    clientId: number;
    managerUserId?: number;
  }): Promise<ClientInvoiceLineRow[]>;
}

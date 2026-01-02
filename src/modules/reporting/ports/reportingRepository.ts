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

export type ClientRefRow = {
  serviceId: number;
  year: number;
  month: number;
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
  getLatestEntry(): Promise<YearMonth | null>;
  getLatestEntryForClient(clientId: number): Promise<YearMonth | null>;
  getMonthlyGroups(params: { years: number[]; month: number }): Promise<MonthlyGroupRow[]>;
  getMonthlyRefs(params: { years: number[]; month: number }): Promise<MonthlyRefRow[]>;
  getClientsByIds(ids: number[]): Promise<ClientRow[]>;
  getServicesByIds(ids: number[]): Promise<ServiceRow[]>;
  getClientById(id: number): Promise<ClientRow | null>;
  getClientGroups(params: {
    clientId: number;
    years: number[];
    month: number;
  }): Promise<ClientGroupRow[]>;
  getClientRefs(params: {
    clientId: number;
    years: number[];
    month: number;
  }): Promise<ClientRefRow[]>;
}

import type {
  ReportingRepository,
  YearMonth,
  MonthlyGroupRow,
  MonthlyRefRow,
  ClientGroupRow,
  ClientRefRow,
  ClientRow,
  ServiceRow,
} from "../../ports/reportingRepository";

type SeedData = {
  latestEntry?: YearMonth | null;
  latestEntryByClient?: Map<number, YearMonth | null>;
  monthlyGroups?: MonthlyGroupRow[];
  monthlyRefs?: MonthlyRefRow[];
  clients?: ClientRow[];
  services?: ServiceRow[];
  clientGroupsByClientId?: Map<number, ClientGroupRow[]>;
  clientRefsByClientId?: Map<number, ClientRefRow[]>;
};

export class InMemoryReportingRepository implements ReportingRepository {
  private latestEntry: YearMonth | null;
  private latestEntryByClient: Map<number, YearMonth | null>;
  private monthlyGroups: MonthlyGroupRow[];
  private monthlyRefs: MonthlyRefRow[];
  private clients: ClientRow[];
  private services: ServiceRow[];
  private clientGroupsByClientId: Map<number, ClientGroupRow[]>;
  private clientRefsByClientId: Map<number, ClientRefRow[]>;

  constructor(seed: SeedData = {}) {
    this.latestEntry = seed.latestEntry ?? null;
    this.latestEntryByClient = seed.latestEntryByClient ?? new Map();
    this.monthlyGroups = seed.monthlyGroups ?? [];
    this.monthlyRefs = seed.monthlyRefs ?? [];
    this.clients = seed.clients ?? [];
    this.services = seed.services ?? [];
    this.clientGroupsByClientId = seed.clientGroupsByClientId ?? new Map();
    this.clientRefsByClientId = seed.clientRefsByClientId ?? new Map();
  }

  async getLatestEntry() {
    return this.latestEntry;
  }

  async getLatestEntryForClient(clientId: number) {
    return this.latestEntryByClient.get(clientId) ?? null;
  }

  async getMonthlyGroups({ years, month }: { years: number[]; month: number }) {
    return this.monthlyGroups.filter(
      (row) => years.includes(row.year) && row.month === month,
    );
  }

  async getMonthlyRefs({ years, month }: { years: number[]; month: number }) {
    return this.monthlyRefs.filter(
      (row) => years.includes(row.year) && row.month === month,
    );
  }

  async getClientsByIds(ids: number[]) {
    return this.clients.filter((client) => ids.includes(client.id));
  }

  async getServicesByIds(ids: number[]) {
    return this.services.filter((service) => ids.includes(service.id));
  }

  async getClientById(id: number) {
    return this.clients.find((client) => client.id === id) ?? null;
  }

  async getClientGroups({ clientId, years, month }: { clientId: number; years: number[]; month: number }) {
    const rows = this.clientGroupsByClientId.get(clientId) ?? [];
    return rows.filter((row) => years.includes(row.year) && row.month === month);
  }

  async getClientRefs({ clientId, years, month }: { clientId: number; years: number[]; month: number }) {
    const rows = this.clientRefsByClientId.get(clientId) ?? [];
    return rows.filter((row) => years.includes(row.year) && row.month === month);
  }
}

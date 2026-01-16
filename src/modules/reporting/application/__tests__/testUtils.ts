import type {
  ReportingQueryRepository,
  YearMonth,
  MonthlyGroupRow,
  MonthlyRefRow,
  MonthlyManagerRow,
  MonthlyLineRow,
  ClientGroupRow,
  ClientRefRow,
  ClientManagerRow,
  ClientLineRow,
  ClientRow,
  ServiceRow,
  ClientInvoiceLineRow,
} from "../../ports/reportingRepository";

type SeedData = {
  latestEntry?: YearMonth | null;
  latestEntryByClient?: Map<number, YearMonth | null>;
  monthlyGroups?: MonthlyGroupRow[];
  monthlyRefs?: MonthlyRefRow[];
  monthlyManagers?: MonthlyManagerRow[];
  monthlyLines?: MonthlyLineRow[];
  clients?: ClientRow[];
  services?: ServiceRow[];
  clientGroupsByClientId?: Map<number, ClientGroupRow[]>;
  clientRefsByClientId?: Map<number, ClientRefRow[]>;
  clientManagersByClientId?: Map<number, ClientManagerRow[]>;
  clientLinesByClientIdForComparison?: Map<number, ClientLineRow[]>;
  clientLinesByClientId?: Map<number, ClientInvoiceLineRow[]>;
};

export class InMemoryReportingRepository implements ReportingQueryRepository {
  private latestEntry: YearMonth | null;
  private latestEntryByClient: Map<number, YearMonth | null>;
  private monthlyGroups: MonthlyGroupRow[];
  private monthlyRefs: MonthlyRefRow[];
  private monthlyManagers: MonthlyManagerRow[];
  private monthlyLines: MonthlyLineRow[];
  private clients: ClientRow[];
  private services: ServiceRow[];
  private clientGroupsByClientId: Map<number, ClientGroupRow[]>;
  private clientRefsByClientId: Map<number, ClientRefRow[]>;
  private clientManagersByClientId: Map<number, ClientManagerRow[]>;
  private clientLinesByClientIdForComparison: Map<number, ClientLineRow[]>;
  private clientLinesByClientId: Map<number, ClientInvoiceLineRow[]>;

  constructor(seed: SeedData = {}) {
    this.latestEntry = seed.latestEntry ?? null;
    this.latestEntryByClient = seed.latestEntryByClient ?? new Map();
    this.monthlyGroups = seed.monthlyGroups ?? [];
    this.monthlyRefs = seed.monthlyRefs ?? [];
    this.monthlyManagers = seed.monthlyManagers ?? [];
    this.monthlyLines = seed.monthlyLines ?? [];
    this.clients = seed.clients ?? [];
    this.services = seed.services ?? [];
    this.clientGroupsByClientId = seed.clientGroupsByClientId ?? new Map();
    this.clientRefsByClientId = seed.clientRefsByClientId ?? new Map();
    this.clientManagersByClientId = seed.clientManagersByClientId ?? new Map();
    this.clientLinesByClientIdForComparison =
      seed.clientLinesByClientIdForComparison ?? new Map();
    this.clientLinesByClientId = seed.clientLinesByClientId ?? new Map();
  }

  async getLatestEntry() {
    return this.latestEntry;
  }

  async getLatestEntryForClient(clientId: number) {
    return this.latestEntryByClient.get(clientId) ?? null;
  }

  async getMonthlyLinesForMonths({
    months,
    clientId,
  }: {
    months: YearMonth[];
    clientId?: number;
    managerUserId?: number;
  }) {
    const monthSet = new Set(months.map((entry) => `${entry.year}-${entry.month}`));
    return this.monthlyLines.filter((row) => {
      const matchesMonth = monthSet.has(`${row.year}-${row.month}`);
      const matchesClient = clientId ? row.clientId === clientId : true;
      return matchesMonth && matchesClient;
    });
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

  async getMonthlyManagers({ years, month }: { years: number[]; month: number }) {
    return this.monthlyManagers.filter(
      (row) => years.includes(row.year) && row.month === month,
    );
  }

  async getMonthlyLines({ years, month }: { years: number[]; month: number }) {
    return this.monthlyLines.filter((row) => years.includes(row.year) && row.month === month);
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

  async getClientManagers({ clientId, years, month }: { clientId: number; years: number[]; month: number }) {
    const rows = this.clientManagersByClientId.get(clientId) ?? [];
    return rows.filter((row) => years.includes(row.year) && row.month === month);
  }

  async getClientLines({ clientId, years, month }: { clientId: number; years: number[]; month: number }) {
    const rows = this.clientLinesByClientIdForComparison.get(clientId) ?? [];
    return rows.filter((row) => years.includes(row.year) && row.month === month);
  }

  async getClientInvoiceLines({ clientId }: { clientId: number }) {
    return this.clientLinesByClientId.get(clientId) ?? [];
  }
}

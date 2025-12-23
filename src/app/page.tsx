import Link from "next/link";

import { prisma } from "@/lib/db";
import { formatCurrency, formatUnits } from "@/lib/format";

type SearchParams = {
  year?: string;
  month?: string;
};

type RowKey = `${number}-${number}`;

type SummaryRow = {
  clientId: number;
  serviceId: number;
  clientName: string;
  serviceName: string;
  previousTotal: number;
  currentTotal: number;
  previousUnits: number;
  currentUnits: number;
  delta: number;
};

function toInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export default async function Home({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const latestEntry =
    (await prisma.invoiceLine.findFirst({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      select: { year: true, month: true },
    })) ?? undefined;

  const defaultYear = latestEntry?.year ?? new Date().getFullYear();
  const defaultMonth = latestEntry?.month ?? new Date().getMonth() + 1;

  const year = toInt(searchParams?.year, defaultYear);
  const month = toInt(searchParams?.month, defaultMonth);
  const previousYear = year - 1;

  const groups = await prisma.invoiceLine.groupBy({
    by: ["clientId", "serviceId", "year", "month"],
    where: {
      month,
      year: { in: [previousYear, year] },
    },
    _sum: {
      total: true,
      units: true,
    },
  });

  const clientIds = Array.from(new Set(groups.map((group) => group.clientId)));
  const serviceIds = Array.from(new Set(groups.map((group) => group.serviceId)));

  const [clients, services] = await Promise.all([
    prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, nameRaw: true },
    }),
    prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, conceptRaw: true },
    }),
  ]);

  const clientMap = new Map(clients.map((client) => [client.id, client.nameRaw]));
  const serviceMap = new Map(
    services.map((service) => [service.id, service.conceptRaw]),
  );

  const rows = new Map<RowKey, SummaryRow>();

  for (const group of groups) {
    const key = `${group.clientId}-${group.serviceId}` as RowKey;
    const existing = rows.get(key) ?? {
      clientId: group.clientId,
      serviceId: group.serviceId,
      clientName: clientMap.get(group.clientId) ?? "Unknown client",
      serviceName: serviceMap.get(group.serviceId) ?? "Unknown service",
      previousTotal: 0,
      currentTotal: 0,
      previousUnits: 0,
      currentUnits: 0,
      delta: 0,
    };

    if (group.year === year) {
      existing.currentTotal = group._sum.total ?? 0;
      existing.currentUnits = group._sum.units ?? 0;
    } else {
      existing.previousTotal = group._sum.total ?? 0;
      existing.previousUnits = group._sum.units ?? 0;
    }

    rows.set(key, existing);
  }

  const summaries = Array.from(rows.values())
    .map((row) => ({
      ...row,
      delta: row.currentTotal - row.previousTotal,
    }))
    .filter((row) => Math.abs(row.delta) > 0.001)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Comparativa mensual</p>
          <h1>Diferencies per client i servei</h1>
          <p className="subtitle">
            Comparant {month}/{previousYear} amb {month}/{year}
          </p>
        </div>
        <form className="filters" method="get">
          <label>
            Any
            <input
              type="number"
              min="2000"
              name="year"
              defaultValue={year}
            />
          </label>
          <label>
            Mes
            <input
              type="number"
              min="1"
              max="12"
              name="month"
              defaultValue={month}
            />
          </label>
          <button type="submit">Actualitza</button>
        </form>
      </header>

      <section className="card">
        <div className="table-header">
          <span>Resultats amb diferencies ({summaries.length})</span>
          <span className="hint">Clicka un client per veure el detall</span>
        </div>
        <div className="table">
          <div className="table-row table-head">
            <span>Client</span>
            <span>Servei</span>
            <span className="num">{previousYear}</span>
            <span className="num">{year}</span>
            <span className="num">Delta</span>
            <span className="num">Unitats</span>
          </div>
          {summaries.map((row) => (
            <div key={`${row.clientId}-${row.serviceId}`} className="table-row">
              <span>
                <Link
                  href={`/client/${row.clientId}?year=${year}&month=${month}`}
                >
                  {row.clientName}
                </Link>
              </span>
              <span>{row.serviceName}</span>
              <span className="num">{formatCurrency(row.previousTotal)}</span>
              <span className="num">{formatCurrency(row.currentTotal)}</span>
              <span className={`num delta ${row.delta < 0 ? "down" : "up"}`}>
                {formatCurrency(row.delta)}
              </span>
              <span className="num">
                {formatUnits(row.previousUnits)} ->{" "}
                {formatUnits(row.currentUnits)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

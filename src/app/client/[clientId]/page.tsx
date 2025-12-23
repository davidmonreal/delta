import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { formatCurrency, formatUnits } from "@/lib/format";

type SearchParams = {
  year?: string;
  month?: string;
};

function toInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export default async function ClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const clientId = Number.parseInt(resolvedParams.clientId, 10);
  if (Number.isNaN(clientId)) {
    notFound();
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, nameRaw: true },
  });

  if (!client) {
    notFound();
  }

  const latestEntry =
    (await prisma.invoiceLine.findFirst({
      where: { clientId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      select: { year: true, month: true },
    })) ?? undefined;

  const defaultYear = latestEntry?.year ?? new Date().getFullYear();
  const defaultMonth = latestEntry?.month ?? new Date().getMonth() + 1;
  const year = toInt(resolvedSearchParams.year, defaultYear);
  const month = toInt(resolvedSearchParams.month, defaultMonth);
  const previousYear = year - 1;

  const groups = await prisma.invoiceLine.groupBy({
    by: ["serviceId", "year", "month"],
    where: {
      clientId,
      month,
      year: { in: [previousYear, year] },
    },
    _sum: {
      total: true,
      units: true,
    },
  });

  const serviceIds = Array.from(new Set(groups.map((group) => group.serviceId)));
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, conceptRaw: true },
  });
  const serviceMap = new Map(
    services.map((service) => [service.id, service.conceptRaw]),
  );

  const rows = new Map<number, {
    serviceId: number;
    serviceName: string;
    previousTotal: number;
    currentTotal: number;
    previousUnits: number;
    currentUnits: number;
  }>();

  for (const group of groups) {
    const existing = rows.get(group.serviceId) ?? {
      serviceId: group.serviceId,
      serviceName: serviceMap.get(group.serviceId) ?? "Unknown service",
      previousTotal: 0,
      currentTotal: 0,
      previousUnits: 0,
      currentUnits: 0,
    };

    if (group.year === year) {
      existing.currentTotal = group._sum.total ?? 0;
      existing.currentUnits = group._sum.units ?? 0;
    } else {
      existing.previousTotal = group._sum.total ?? 0;
      existing.previousUnits = group._sum.units ?? 0;
    }

    rows.set(group.serviceId, existing);
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
          <p className="eyebrow">
            <Link href="/">&lt;- Tornar a la vista principal</Link>
          </p>
          <h1>{client.nameRaw}</h1>
          <p className="subtitle">
            Diferencies per servei ({month}/{previousYear} vs {month}/{year})
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
        </div>
        <div className="table">
          <div className="table-row table-head">
            <span>Servei</span>
            <span className="num">{previousYear}</span>
            <span className="num">{year}</span>
            <span className="num">Delta</span>
            <span className="num">Unitats</span>
          </div>
          {summaries.map((row) => (
            <div key={row.serviceId} className="table-row">
              <span>{row.serviceName}</span>
              <span className="num">{formatCurrency(row.previousTotal)}</span>
              <span className="num">{formatCurrency(row.currentTotal)}</span>
              <span className={`num delta ${row.delta < 0 ? "down" : "up"}`}>
                {formatCurrency(row.delta)}
              </span>
              <span className="num">
                {formatUnits(row.previousUnits)} {"->"}{" "}
                {formatUnits(row.currentUnits)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

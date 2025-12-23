import Link from "next/link";

import { prisma } from "@/lib/db";
import { formatCurrency, formatPercent, formatUnits } from "@/lib/format";

type SearchParams = {
  year?: string;
  month?: string;
  show?: string;
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
  previousUnitPrice: number;
  currentUnitPrice: number;
  deltaPrice: number;
  isMissing: boolean;
  percentDelta?: number;
};

function toInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const latestEntry =
    (await prisma.invoiceLine.findFirst({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      select: { year: true, month: true },
    })) ?? undefined;

  const defaultYear = latestEntry?.year ?? new Date().getFullYear();
  const defaultMonth = latestEntry?.month ?? new Date().getMonth() + 1;

  const year = toInt(resolvedSearchParams.year, defaultYear);
  const month = toInt(resolvedSearchParams.month, defaultMonth);
  const previousYear = year - 1;
  const show = resolvedSearchParams.show ?? "neg";
  const showNegative = show === "neg";
  const showEqual = show === "eq";
  const showPositive = show === "pos";

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
      previousUnitPrice: Number.NaN,
      currentUnitPrice: Number.NaN,
      deltaPrice: Number.NaN,
      isMissing: false,
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
    .map((row) => {
      const previousUnitPrice =
        row.previousUnits > 0 ? row.previousTotal / row.previousUnits : Number.NaN;
      const currentUnitPrice =
        row.currentUnits > 0 ? row.currentTotal / row.currentUnits : Number.NaN;
      const hasBoth = row.previousUnits > 0 && row.currentUnits > 0;
      const deltaPrice = hasBoth
        ? currentUnitPrice - previousUnitPrice
        : Number.NaN;
      const isMissing = row.previousUnits > 0 && row.currentUnits === 0;
      return {
        ...row,
        previousUnitPrice,
        currentUnitPrice,
        deltaPrice,
        isMissing,
        percentDelta:
          hasBoth && previousUnitPrice > 0
            ? ((currentUnitPrice - previousUnitPrice) / previousUnitPrice) * 100
            : undefined,
      };
    })
    .filter((row) => {
      if (showNegative) return row.isMissing || row.deltaPrice < -0.001;
      if (showEqual) return Math.abs(row.deltaPrice) <= 0.001;
      if (showPositive) return row.deltaPrice > 0.001;
      return row.deltaPrice < -0.001;
    })
    .sort((a, b) => {
      const aScore = a.isMissing ? Number.POSITIVE_INFINITY : Math.abs(a.deltaPrice);
      const bScore = b.isMissing ? Number.POSITIVE_INFINITY : Math.abs(b.deltaPrice);
      return bScore - aScore;
    });

  const negativeWithPrice = showNegative
    ? summaries.filter((row) => !row.isMissing)
    : [];
  const negativeMissing = showNegative
    ? summaries.filter((row) => row.isMissing)
    : [];
  const visibleRows = showNegative ? negativeWithPrice : summaries;
  const sumDeltaVisible = visibleRows.reduce(
    (total, row) => total + (row.currentTotal - row.previousTotal),
    0,
  );
  const sumDeltaMissing = negativeMissing.reduce(
    (total, row) => total + (row.currentTotal - row.previousTotal),
    0,
  );

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
          <input type="hidden" name="show" value={show} />
          <button type="submit">Actualitza</button>
        </form>
      </header>

      <section className="card">
        <div className="table-header">
          <span>
            {showEqual
              ? "Resultats amb preu unitari igual"
              : "Resultats per preu unitari"}
            {" "}
            ({summaries.length})
            {showNegative ? " negatives" : ""}
          </span>
          <span className="hint">
            <Link href={`/?year=${year}&month=${month}&show=neg`}>
              Nomes negatives
            </Link>
            {" | "}
            <Link href={`/?year=${year}&month=${month}&show=eq`}>
              Iguals
            </Link>
            {" | "}
            <Link href={`/?year=${year}&month=${month}&show=pos`}>
              Mes altes
            </Link>
          </span>
        </div>
        <div className={`table ${showPositive ? "table--wide" : ""}`}>
          <div className="table-row table-head">
            <span>Client</span>
            <span>Servei</span>
            <span className="num">Preu unit. {previousYear}</span>
            <span className="num">Preu unit. {year}</span>
            <span className="num">Delta preu</span>
            {showPositive ? <span className="num">Augment %</span> : null}
            <span className="num">Unitats</span>
          </div>
          {visibleRows.map((row) => (
            <div key={`${row.clientId}-${row.serviceId}`} className="table-row">
              <span>
                <Link
                  href={`/client/${row.clientId}?year=${year}&month=${month}`}
                >
                  {row.clientName}
                </Link>
              </span>
              <span>{row.serviceName}</span>
              <span className="num">{formatCurrency(row.previousUnitPrice)}</span>
              <span className="num">{formatCurrency(row.currentUnitPrice)}</span>
              <span
                className={`num delta ${
                  row.isMissing || row.deltaPrice < 0 ? "down" : "up"
                }`}
              >
                {row.isMissing ? "No fet" : formatCurrency(row.deltaPrice)}
              </span>
              {showPositive ? (
                <span className="num">
                  {formatPercent(row.percentDelta ?? Number.NaN)}
                </span>
              ) : null}
              <span className="num">
                {formatUnits(row.previousUnits)} {"->"}{" "}
                {formatUnits(row.currentUnits)}
              </span>
            </div>
          ))}
          <div className="table-row table-foot">
            <span>Total diferencia</span>
            <span />
            <span />
            <span className="num">{formatCurrency(sumDeltaVisible)}</span>
            <span />
            {showPositive ? <span /> : null}
            <span />
          </div>
        </div>
        {showNegative && negativeMissing.length > 0 ? (
          <div className="table">
            <div className="table-row table-head">
              <span>No fets</span>
              <span>Servei</span>
              <span className="num">Preu unit. {previousYear}</span>
              <span className="num">Preu unit. {year}</span>
              <span className="num">Delta preu</span>
              <span className="num">Unitats</span>
            </div>
            {negativeMissing.map((row) => (
              <div key={`${row.clientId}-${row.serviceId}`} className="table-row">
                <span>
                  <Link
                    href={`/client/${row.clientId}?year=${year}&month=${month}`}
                  >
                    {row.clientName}
                  </Link>
                </span>
                <span>{row.serviceName}</span>
                <span className="num">{formatCurrency(row.previousUnitPrice)}</span>
                <span className="num">-</span>
                <span className="num delta down">No fet</span>
                <span className="num">{formatUnits(row.previousUnits)} {"->"} 0</span>
              </div>
            ))}
            <div className="table-row table-foot">
              <span>Total diferencia</span>
              <span />
              <span />
              <span className="num">{formatCurrency(sumDeltaMissing)}</span>
              <span />
              <span />
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { formatCurrency, formatPercent, formatUnits } from "@/lib/format";
import { requireSession } from "@/lib/require-auth";

type SearchParams = {
  year?: string;
  month?: string;
  show?: string;
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
  await requireSession();
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
  const show = resolvedSearchParams.show ?? "neg";
  const showNegative = show === "neg";
  const showEqual = show === "eq";
  const showPositive = show === "pos";

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

  const refs = await prisma.invoiceLine.findMany({
    where: {
      clientId,
      month,
      year: { in: [previousYear, year] },
    },
    select: {
      serviceId: true,
      year: true,
      series: true,
      albaran: true,
      numero: true,
    },
  });

  const refMap = new Map<string, string>();
  for (const ref of refs) {
    const key = `${ref.serviceId}-${ref.year}`;
    if (refMap.has(key)) continue;
    const seriesPart = ref.series || ref.albaran || "";
    const numberPart = ref.numero || ref.albaran || "";
    const label =
      seriesPart && numberPart && seriesPart !== numberPart
        ? `${seriesPart}-${numberPart}`
        : seriesPart || numberPart || null;
    if (label) refMap.set(key, label);
  }

  const serviceIds = Array.from(new Set(groups.map((group) => group.serviceId)));
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, conceptRaw: true },
  });
  const serviceMap = new Map(
    services.map((service) => [service.id, service.conceptRaw]),
  );

  const rows = new Map<
    number,
    {
      serviceId: number;
      serviceName: string;
      previousRef: string | null;
      currentRef: string | null;
      previousTotal: number;
      currentTotal: number;
      previousUnits: number;
      currentUnits: number;
      previousUnitPrice: number;
      currentUnitPrice: number;
      deltaPrice: number;
      isMissing: boolean;
      percentDelta?: number;
    }
  >();

  for (const group of groups) {
    const existing = rows.get(group.serviceId) ?? {
      serviceId: group.serviceId,
      serviceName: serviceMap.get(group.serviceId) ?? "Unknown service",
      previousRef: refMap.get(`${group.serviceId}-${previousYear}`) ?? null,
      currentRef: refMap.get(`${group.serviceId}-${year}`) ?? null,
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
      existing.currentRef =
        refMap.get(`${group.serviceId}-${year}`) ?? existing.currentRef;
    } else {
      existing.previousTotal = group._sum.total ?? 0;
      existing.previousUnits = group._sum.units ?? 0;
      existing.previousRef =
        refMap.get(`${group.serviceId}-${previousYear}`) ?? existing.previousRef;
    }

    rows.set(group.serviceId, existing);
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
  const sumDeltaVisible = summaries.reduce(
    (total, row) => total + (row.currentTotal - row.previousTotal),
    0,
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-4">
            <img src="/logo-busbac.png" alt="Busbac" className="h-16 w-auto" />
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
              <Link href="/" className="hover:text-emerald-700">
                &lt;- Tornar a la vista principal
              </Link>
            </p>
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
            {client.nameRaw}
          </h1>
          <p className="mt-2 text-base text-slate-500">
            Diferencies per servei ({month}/{previousYear} vs {month}/{year})
          </p>
        </div>
        <form
          className="grid w-full max-w-xl grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          method="get"
        >
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            Any
            <input
              type="number"
              min="2000"
              name="year"
              defaultValue={year}
              className="rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            Mes
            <input
              type="number"
              min="1"
              max="12"
              name="month"
              defaultValue={month}
              className="rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <input type="hidden" name="show" value={show} />
          <button
            type="submit"
            className="col-span-2 rounded-full bg-emerald-700 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            Actualitza
          </button>
        </form>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>
            {showEqual
              ? "Resultats amb preu unitari igual"
              : "Resultats per preu unitari"}{" "}
            ({summaries.length})
            {showNegative ? " negatives" : ""}
          </span>
          <span className="rounded-full bg-emerald-50 px-4 py-1 text-xs font-semibold text-emerald-800">
            <Link href={`/client/${clientId}?year=${year}&month=${month}&show=neg`}>
              Nomes negatives
            </Link>
            {" | "}
            <Link href={`/client/${clientId}?year=${year}&month=${month}&show=eq`}>
              Iguals
            </Link>
            {" | "}
            <Link href={`/client/${clientId}?year=${year}&month=${month}&show=pos`}>
              Mes altes
            </Link>
          </span>
        </div>
        <div className="grid gap-3">
          <div
            className={`grid items-center gap-4 rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 ${
              showPositive
                ? "grid-cols-[2fr_repeat(5,minmax(110px,1fr))]"
                : "grid-cols-[2fr_repeat(4,minmax(110px,1fr))]"
            }`}
          >
            <span>Servei</span>
            <span className="text-right">Preu unit. {previousYear}</span>
            <span className="text-right">Preu unit. {year}</span>
            <span className="text-right">Delta preu</span>
            {showPositive ? <span className="text-right">Augment %</span> : null}
            <span className="text-right">Unitats</span>
          </div>
          {summaries.map((row) => (
            <div
              key={row.serviceId}
              className={`grid items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 ${
                showPositive
                  ? "grid-cols-[2fr_repeat(5,minmax(110px,1fr))]"
                  : "grid-cols-[2fr_repeat(4,minmax(110px,1fr))]"
              }`}
            >
              <span className="font-medium">{row.serviceName}</span>
              <span className="text-right tabular-nums">
                <span className="block">{formatCurrency(row.previousUnitPrice)}</span>
                <span className="mt-1 block text-xs text-slate-400">
                  {row.previousRef ?? "-"}
                </span>
              </span>
              <span className="text-right tabular-nums">
                <span className="block">{formatCurrency(row.currentUnitPrice)}</span>
                <span className="mt-1 block text-xs text-slate-400">
                  {row.currentRef ?? "-"}
                </span>
              </span>
              <span
                className={`text-right font-semibold tabular-nums ${
                  row.isMissing || row.deltaPrice < 0
                    ? "text-red-600"
                    : "text-emerald-700"
                }`}
              >
                {row.isMissing ? "No fet" : formatCurrency(row.deltaPrice)}
              </span>
              {showPositive ? (
                <span className="text-right tabular-nums">
                  {formatPercent(row.percentDelta ?? Number.NaN)}
                </span>
              ) : null}
              <span className="text-right tabular-nums">
                {formatUnits(row.previousUnits)} {"->"} {formatUnits(row.currentUnits)}
              </span>
            </div>
          ))}
          <div className="grid grid-cols-[2fr_repeat(4,minmax(110px,1fr))] items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
            <span>Total diferencia</span>
            <span />
            <span />
            <span className="text-right tabular-nums">{formatCurrency(sumDeltaVisible)}</span>
            <span />
            <span />
          </div>
        </div>
      </section>
    </div>
  );
}

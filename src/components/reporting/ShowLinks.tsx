import Link from "next/link";

type ShowLinksProps = {
  baseHref: string;
  year: number;
  month: number;
  activeShow: string;
  showPercentUnder: boolean;
  showPercentEqual: boolean;
  showPercentOver: boolean;
  showCounts?: {
    neg: number;
    eq: number;
    pos: number;
    miss: number;
    new: number;
  };
};

export default function ShowLinks({
  baseHref,
  year,
  month,
  activeShow,
  showPercentUnder,
  showPercentEqual,
  showPercentOver,
  showCounts,
}: ShowLinksProps) {
  const linkClass = (value: string) =>
    value === activeShow
      ? "rounded-full bg-emerald-700 px-3 py-1 text-white shadow-sm"
      : "rounded-full border border-emerald-200 bg-white px-3 py-1 text-emerald-800 hover:bg-emerald-50";
  const badgeClass = (value: string) =>
    value === activeShow
      ? "ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs text-white"
      : "ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700";
  const percentParams = new URLSearchParams({
    pctUnder: showPercentUnder ? "1" : "0",
    pctEqual: showPercentEqual ? "1" : "0",
    pctOver: showPercentOver ? "1" : "0",
  });
  const percentSuffix = percentParams.toString();
  const percentQuery = percentSuffix ? `&${percentSuffix}` : "";

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
      <Link
        href={`${baseHref}?year=${year}&month=${month}&show=neg${percentQuery}`}
        className={linkClass("neg")}
      >
        Només negatives
        {showCounts ? (
          <span className={badgeClass("neg")}>{showCounts.neg}</span>
        ) : null}
      </Link>
      <Link
        href={`${baseHref}?year=${year}&month=${month}&show=eq${percentQuery}`}
        className={linkClass("eq")}
      >
        Iguals
        {showCounts ? (
          <span className={badgeClass("eq")}>{showCounts.eq}</span>
        ) : null}
      </Link>
      <Link
        href={`${baseHref}?year=${year}&month=${month}&show=pos${percentQuery}`}
        className={linkClass("pos")}
      >
        Més altes
        {showCounts ? (
          <span className={badgeClass("pos")}>{showCounts.pos}</span>
        ) : null}
      </Link>
      <Link
        href={`${baseHref}?year=${year}&month=${month}&show=miss${percentQuery}`}
        className={linkClass("miss")}
      >
        No fets
        {showCounts ? (
          <span className={badgeClass("miss")}>{showCounts.miss}</span>
        ) : null}
      </Link>
      <Link
        href={`${baseHref}?year=${year}&month=${month}&show=new${percentQuery}`}
        className={linkClass("new")}
      >
        Nous
        {showCounts ? (
          <span className={badgeClass("new")}>{showCounts.new}</span>
        ) : null}
      </Link>
    </div>
  );
}

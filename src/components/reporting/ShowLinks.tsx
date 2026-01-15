import Link from "next/link";

type ShowLinksProps = {
  baseHref: string;
  year: number;
  month: number;
  activeShow: string;
  showPercentUnder: boolean;
  showPercentEqual: boolean;
  showPercentOver: boolean;
};

export default function ShowLinks({
  baseHref,
  year,
  month,
  activeShow,
  showPercentUnder,
  showPercentEqual,
  showPercentOver,
}: ShowLinksProps) {
  const linkClass = (value: string) =>
    value === activeShow
      ? "rounded-full bg-emerald-700 px-3 py-1 text-white shadow-sm"
      : "rounded-full border border-emerald-200 bg-white px-3 py-1 text-emerald-800 hover:bg-emerald-50";
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
      </Link>
      <Link
        href={`${baseHref}?year=${year}&month=${month}&show=eq${percentQuery}`}
        className={linkClass("eq")}
      >
        Iguals
      </Link>
      <Link
        href={`${baseHref}?year=${year}&month=${month}&show=pos${percentQuery}`}
        className={linkClass("pos")}
      >
        Més altes
      </Link>
      <Link
        href={`${baseHref}?year=${year}&month=${month}&show=miss${percentQuery}`}
        className={linkClass("miss")}
      >
        No fets
      </Link>
      <Link
        href={`${baseHref}?year=${year}&month=${month}&show=new${percentQuery}`}
        className={linkClass("new")}
      >
        Nous
      </Link>
    </div>
  );
}

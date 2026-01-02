import Link from "next/link";

type ShowLinksProps = {
  baseHref: string;
  year: number;
  month: number;
  activeShow: string;
};

export default function ShowLinks({
  baseHref,
  year,
  month,
  activeShow,
}: ShowLinksProps) {
  const linkClass = (value: string) =>
    value === activeShow
      ? "rounded-full bg-emerald-200 px-2 py-0.5 font-semibold text-emerald-900"
      : "text-emerald-800";

  return (
    <span className="rounded-full bg-emerald-50 px-4 py-1 text-xs font-semibold text-emerald-800">
      <Link
        href={`${baseHref}?year=${year}&month=${month}&show=neg`}
        className={linkClass("neg")}
      >
        Nomes negatives
      </Link>
      {" | "}
      <Link
        href={`${baseHref}?year=${year}&month=${month}&show=eq`}
        className={linkClass("eq")}
      >
        Iguals
      </Link>
      {" | "}
      <Link
        href={`${baseHref}?year=${year}&month=${month}&show=pos`}
        className={linkClass("pos")}
      >
        Mes altes
      </Link>
      {" | "}
      <Link
        href={`${baseHref}?year=${year}&month=${month}&show=miss`}
        className={linkClass("miss")}
      >
        No fets
      </Link>
    </span>
  );
}

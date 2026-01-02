import Link from "next/link";

type ShowLinksProps = {
  baseHref: string;
  year: number;
  month: number;
};

export default function ShowLinks({ baseHref, year, month }: ShowLinksProps) {
  return (
    <span className="rounded-full bg-emerald-50 px-4 py-1 text-xs font-semibold text-emerald-800">
      <Link href={`${baseHref}?year=${year}&month=${month}&show=neg`}>Nomes negatives</Link>
      {" | "}
      <Link href={`${baseHref}?year=${year}&month=${month}&show=eq`}>Iguals</Link>
      {" | "}
      <Link href={`${baseHref}?year=${year}&month=${month}&show=pos`}>Mes altes</Link>
    </span>
  );
}

"use client";

import Link from "next/link";

import type { ShowFilter } from "@/modules/reporting/dto/reportingSchemas";

type ShowLinksProps = {
  baseHref: string;
  year: number;
  month: number;
  activeShow: ShowFilter;
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
  onShowChange?: (show: ShowFilter) => void;
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
  onShowChange,
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

  const items: Array<{ value: ShowFilter; label: string; count?: number }> = [
    { value: "neg", label: "Només negatives", count: showCounts?.neg },
    { value: "eq", label: "Iguals", count: showCounts?.eq },
    { value: "pos", label: "Més altes", count: showCounts?.pos },
    { value: "miss", label: "No fets", count: showCounts?.miss },
    { value: "new", label: "Nous", count: showCounts?.new },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
      {items.map((item) =>
        onShowChange ? (
          <button
            key={item.value}
            type="button"
            onClick={() => onShowChange(item.value)}
            className={linkClass(item.value)}
          >
            {item.label}
            {item.count !== undefined ? (
              <span className={badgeClass(item.value)}>{item.count}</span>
            ) : null}
          </button>
        ) : (
          <Link
            key={item.value}
            href={`${baseHref}?year=${year}&month=${month}&show=${item.value}${percentQuery}`}
            className={linkClass(item.value)}
          >
            {item.label}
            {item.count !== undefined ? (
              <span className={badgeClass(item.value)}>{item.count}</span>
            ) : null}
          </Link>
        ),
      )}
    </div>
  );
}

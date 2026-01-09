"use client";

import { useEffect, useRef } from "react";

type PercentFilterFormProps = {
  baseHref: string;
  year: number;
  month: number;
  show: string;
  showPercentUnder: boolean;
  showPercentEqual: boolean;
  showPercentOver: boolean;
};

export default function PercentFilterForm({
  baseHref,
  year,
  month,
  show,
  showPercentUnder,
  showPercentEqual,
  showPercentOver,
}: PercentFilterFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const handler = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT") {
        form.requestSubmit();
      }
    };
    form.addEventListener("change", handler);
    return () => {
      form.removeEventListener("change", handler);
    };
  }, []);

  return (
    <form
      action={baseHref}
      method="get"
      ref={formRef}
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600"
    >
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="show" value={show} />
      <span className="uppercase tracking-[0.2em] text-slate-400">Variació %</span>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="pctUnder"
          value="1"
          defaultChecked={showPercentUnder}
          className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-200"
        />
        Menys del 3%
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="pctEqual"
          value="1"
          defaultChecked={showPercentEqual}
          className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-200"
        />
        3%
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="pctOver"
          value="1"
          defaultChecked={showPercentOver}
          className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-200"
        />
        Més del 3%
      </label>
    </form>
  );
}

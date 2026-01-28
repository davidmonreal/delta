"use client";

import { useEffect, useRef } from "react";

import type { ComparisonRangeType } from "@/modules/reporting/dto/reportingSchemas";
import type { PeriodRange } from "@/modules/reporting/domain/periods";

type PercentFilterFormProps = {
  baseHref: string;
  periodA: PeriodRange;
  periodB: PeriodRange;
  rangeType?: ComparisonRangeType;
  show: string;
  showPercentUnder: boolean;
  showPercentEqual: boolean;
  showPercentOver: boolean;
};

export default function PercentFilterForm({
  baseHref,
  periodA,
  periodB,
  rangeType,
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
      <input type="hidden" name="aStartYear" value={periodA.startYear} />
      <input type="hidden" name="aStartMonth" value={periodA.startMonth} />
      <input type="hidden" name="aEndYear" value={periodA.endYear} />
      <input type="hidden" name="aEndMonth" value={periodA.endMonth} />
      <input type="hidden" name="bStartYear" value={periodB.startYear} />
      <input type="hidden" name="bStartMonth" value={periodB.startMonth} />
      <input type="hidden" name="bEndYear" value={periodB.endYear} />
      <input type="hidden" name="bEndMonth" value={periodB.endMonth} />
      {rangeType ? <input type="hidden" name="rangeType" value={rangeType} /> : null}
      <input type="hidden" name="show" value={show} />
      <span className="uppercase tracking-[0.2em] text-slate-400">Variació %</span>
      <label className="flex items-center gap-2">
        <input type="hidden" name="pctUnder" value="0" />
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
        <input type="hidden" name="pctEqual" value="0" />
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
        <input type="hidden" name="pctOver" value="0" />
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

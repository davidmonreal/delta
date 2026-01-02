import React from "react";

type FiltersFormProps = {
  year: number;
  month: number;
  show: string;
};

export default function FiltersForm({ year, month, show }: FiltersFormProps) {
  return (
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
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";

import { ScrollDropdown } from "@/components/common/ScrollDropdown";
import type { ComparisonRangeType } from "@/modules/reporting/dto/reportingSchemas";
import type { PeriodRange } from "@/modules/reporting/domain/periods";
import type { YearMonth } from "@/modules/reporting/ports/reportingRepository";
import {
  buildMonthOptions,
  buildQuarterOptions,
  filterOptionsByValue,
  sortMonthsDesc,
} from "@/components/reporting/filtersOptions";

type FiltersFormProps = {
  periodA: PeriodRange;
  periodB: PeriodRange;
  rangeType: ComparisonRangeType;
  availableMonths: YearMonth[];
  show: string;
};

export default function FiltersForm({
  periodA,
  periodB,
  rangeType,
  availableMonths,
  show,
}: FiltersFormProps) {
  const [selectedRangeType, setSelectedRangeType] =
    useState<ComparisonRangeType>(rangeType);
  const [monthA, setMonthA] = useState(periodA.startMonth);
  const [yearA, setYearA] = useState(periodA.startYear);
  const [monthB, setMonthB] = useState(periodB.startMonth);
  const [yearB, setYearB] = useState(periodB.startYear);
  const [periodAStartValue, setPeriodAStartValue] = useState(
    `${periodA.startYear}-${String(periodA.startMonth).padStart(2, "0")}`,
  );
  const [periodAEndValue, setPeriodAEndValue] = useState(
    `${periodA.endYear}-${String(periodA.endMonth).padStart(2, "0")}`,
  );
  const [periodBStartValue, setPeriodBStartValue] = useState(
    `${periodB.startYear}-${String(periodB.startMonth).padStart(2, "0")}`,
  );
  const [periodBEndValue, setPeriodBEndValue] = useState(
    `${periodB.endYear}-${String(periodB.endMonth).padStart(2, "0")}`,
  );
  const [quarterAValue, setQuarterAValue] = useState(
    `${periodA.startYear}-Q${Math.floor((periodA.startMonth - 1) / 3) + 1}`,
  );
  const [quarterBValue, setQuarterBValue] = useState(
    `${periodB.startYear}-Q${Math.floor((periodB.startMonth - 1) / 3) + 1}`,
  );

  const sourceMonths = useMemo<YearMonth[]>(() => {
    if (availableMonths.length > 0) return availableMonths;
    const fallback = [
      { year: periodA.startYear, month: periodA.startMonth },
      { year: periodA.endYear, month: periodA.endMonth },
      { year: periodB.startYear, month: periodB.startMonth },
      { year: periodB.endYear, month: periodB.endMonth },
    ];
    return Array.from(
      new Map(
        fallback.map((entry) => [`${entry.year}-${entry.month}`, entry]),
      ).values(),
    );
  }, [availableMonths, periodA, periodB]);

  const sortedMonths = useMemo(() => sortMonthsDesc(sourceMonths), [sourceMonths]);

  const monthOptions = useMemo(
    () => buildMonthOptions(sortedMonths),
    [sortedMonths],
  );

  const monthYearValueA = `${yearA}-${String(monthA).padStart(2, "0")}`;
  const monthYearValueB = `${yearB}-${String(monthB).padStart(2, "0")}`;
  const monthOptionsRight =
    selectedRangeType === "month"
      ? filterOptionsByValue(monthOptions, monthYearValueB)
      : monthOptions;

  const quarterOptions = useMemo(
    () => buildQuarterOptions(sortedMonths),
    [sortedMonths],
  );

  const quarterOptionsRight =
    selectedRangeType === "quarter"
      ? filterOptionsByValue(quarterOptions, quarterBValue)
      : quarterOptions;

  const findMonthOption = (value: string) =>
    monthOptions.find((option) => option.value === value);
  const findQuarterOption = (value: string) =>
    quarterOptions.find((option) => option.value === value);

  useEffect(() => {
    if (selectedRangeType !== "month") return;
    if (monthYearValueA !== monthYearValueB) return;
    const fallback = monthOptionsRight[0];
    if (!fallback) return;
    setYearA(fallback.year);
    setMonthA(fallback.month);
  }, [monthOptionsRight, monthYearValueA, monthYearValueB, selectedRangeType]);

  useEffect(() => {
    if (selectedRangeType !== "year") return;
    const targetYear = yearB - 1;
    const targetValue = `${targetYear}-${String(monthB).padStart(2, "0")}`;
    const targetOption = monthOptions.find(
      (option) => option.value === targetValue,
    );
    if (!targetOption) return;
    if (monthYearValueA === targetOption.value) return;
    setYearA(targetOption.year);
    setMonthA(targetOption.month);
  }, [selectedRangeType, yearB, monthB, monthYearValueA, monthOptions]);

  useEffect(() => {
    if (selectedRangeType !== "quarter") return;
    if (quarterAValue !== quarterBValue) return;
    const fallback = quarterOptionsRight[0];
    if (!fallback) return;
    setQuarterAValue(fallback.value);
  }, [quarterAValue, quarterBValue, quarterOptionsRight, selectedRangeType]);

  const isSameMonth =
    selectedRangeType === "month" && monthYearValueA === monthYearValueB;
  const isSameQuarter =
    selectedRangeType === "quarter" && quarterAValue === quarterBValue;
  const isSamePeriod =
    selectedRangeType === "period" &&
    periodAStartValue === periodBStartValue &&
    periodAEndValue === periodBEndValue;
  const showSamePeriodMessage = isSameMonth || isSameQuarter || isSamePeriod;

  const handleRangeTypeChange = (value: ComparisonRangeType) => {
    setSelectedRangeType(value);
  };

  return (
    <form
      className="grid w-full max-w-6xl grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      method="get"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
        <span className="mr-2 uppercase tracking-[0.2em] text-slate-400">
          Tipus comparacio
        </span>
        {(["month", "quarter", "year", "period"] as ComparisonRangeType[]).map(
          (value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleRangeTypeChange(value)}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
              selectedRangeType === value
                ? "bg-emerald-700 text-white shadow-sm"
                : "border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50"
            }`}
          >
            {value === "month"
              ? "Mes"
              : value === "quarter"
                ? "Trimestre"
                : value === "year"
                  ? "Any"
                : "Periode"}
          </button>
          ),
        )}
        <input type="hidden" name="rangeType" value={selectedRangeType} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Periode A
          </span>
          <div className="min-h-[80px]">
            {selectedRangeType === "month" || selectedRangeType === "year" ? (
              <div className="flex w-48 flex-col gap-2 text-xs font-semibold text-slate-500">
                <ScrollDropdown
                  label="Mes/Any"
                  value={monthYearValueB}
                  options={monthOptions}
                  onChange={(value) => {
                    const option = findMonthOption(value);
                    if (!option) return;
                    setYearB(option.year);
                    setMonthB(option.month);
                  }}
                />
                <input type="hidden" name="bStartMonth" value={monthB} />
                <input type="hidden" name="bEndMonth" value={monthB} />
                <input type="hidden" name="bStartYear" value={yearB} />
                <input type="hidden" name="bEndYear" value={yearB} />
              </div>
            ) : null}
            {selectedRangeType === "quarter" ? (
              <div className="flex w-48 flex-col gap-2 text-xs font-semibold text-slate-500">
                <ScrollDropdown
                  label="Trimestre"
                  value={quarterBValue}
                  options={quarterOptions}
                  onChange={setQuarterBValue}
                />
                {findQuarterOption(quarterBValue) ? (
                  <>
                    <input
                      type="hidden"
                      name="bStartMonth"
                      value={findQuarterOption(quarterBValue)?.startMonth ?? 1}
                    />
                    <input
                      type="hidden"
                      name="bEndMonth"
                      value={findQuarterOption(quarterBValue)?.endMonth ?? 1}
                    />
                    <input
                      type="hidden"
                      name="bStartYear"
                      value={findQuarterOption(quarterBValue)?.year ?? yearB}
                    />
                    <input
                      type="hidden"
                      name="bEndYear"
                      value={findQuarterOption(quarterBValue)?.year ?? yearB}
                    />
                  </>
                ) : null}
              </div>
            ) : null}
            {selectedRangeType === "period" ? (
              <div className="flex flex-wrap items-start gap-3 md:flex-nowrap">
                <ScrollDropdown
                  label="Mes inici"
                  value={periodBStartValue}
                  options={monthOptions}
                  onChange={setPeriodBStartValue}
                  className="w-40"
                />
                <ScrollDropdown
                  label="Mes fi"
                  value={periodBEndValue}
                  options={monthOptions}
                  onChange={setPeriodBEndValue}
                  className="w-40"
                />
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Periode B
          </span>
          <div className="min-h-[80px]">
            {selectedRangeType === "month" || selectedRangeType === "year" ? (
              <div className="flex w-48 flex-col gap-2 text-xs font-semibold text-slate-500">
                <ScrollDropdown
                  label="Mes/Any"
                  value={monthYearValueA}
                  options={monthOptionsRight}
                  onChange={(value) => {
                    const option = findMonthOption(value);
                    if (!option) return;
                    setYearA(option.year);
                    setMonthA(option.month);
                  }}
                  disabled={selectedRangeType === "year"}
                />
                <input type="hidden" name="aStartMonth" value={monthA} />
                <input type="hidden" name="aEndMonth" value={monthA} />
                <input type="hidden" name="aStartYear" value={yearA} />
                <input type="hidden" name="aEndYear" value={yearA} />
              </div>
            ) : null}
            {selectedRangeType === "quarter" ? (
              <div className="flex w-48 flex-col gap-2 text-xs font-semibold text-slate-500">
                <ScrollDropdown
                  label="Trimestre"
                  value={quarterAValue}
                  options={quarterOptionsRight}
                  onChange={setQuarterAValue}
                />
                {findQuarterOption(quarterAValue) ? (
                  <>
                    <input
                      type="hidden"
                      name="aStartMonth"
                      value={findQuarterOption(quarterAValue)?.startMonth ?? 1}
                    />
                    <input
                      type="hidden"
                      name="aEndMonth"
                      value={findQuarterOption(quarterAValue)?.endMonth ?? 1}
                    />
                    <input
                      type="hidden"
                      name="aStartYear"
                      value={findQuarterOption(quarterAValue)?.year ?? yearA}
                    />
                    <input
                      type="hidden"
                      name="aEndYear"
                      value={findQuarterOption(quarterAValue)?.year ?? yearA}
                    />
                  </>
                ) : null}
              </div>
            ) : null}
            {selectedRangeType === "period" ? (
              <div className="flex flex-wrap items-start gap-3 md:flex-nowrap">
                <ScrollDropdown
                  label="Mes inici"
                  value={periodAStartValue}
                  options={monthOptions}
                  onChange={setPeriodAStartValue}
                  className="w-40"
                />
                <ScrollDropdown
                  label="Mes fi"
                  value={periodAEndValue}
                  options={monthOptions}
                  onChange={setPeriodAEndValue}
                  className="w-40"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {showSamePeriodMessage ? (
        <p className="text-xs font-semibold text-amber-600">
          No pots comparar un periode amb si mateix.
        </p>
      ) : null}

      <input type="hidden" name="show" value={show} />

      {selectedRangeType === "period" ? (
        <>
          {findMonthOption(periodAStartValue) ? (
            <>
              <input
                type="hidden"
                name="aStartYear"
                value={findMonthOption(periodAStartValue)?.year ?? periodA.startYear}
              />
              <input
                type="hidden"
                name="aStartMonth"
                value={findMonthOption(periodAStartValue)?.month ?? periodA.startMonth}
              />
            </>
          ) : null}
          {findMonthOption(periodAEndValue) ? (
            <>
              <input
                type="hidden"
                name="aEndYear"
                value={findMonthOption(periodAEndValue)?.year ?? periodA.endYear}
              />
              <input
                type="hidden"
                name="aEndMonth"
                value={findMonthOption(periodAEndValue)?.month ?? periodA.endMonth}
              />
            </>
          ) : null}
          {findMonthOption(periodBStartValue) ? (
            <>
              <input
                type="hidden"
                name="bStartYear"
                value={findMonthOption(periodBStartValue)?.year ?? periodB.startYear}
              />
              <input
                type="hidden"
                name="bStartMonth"
                value={findMonthOption(periodBStartValue)?.month ?? periodB.startMonth}
              />
            </>
          ) : null}
          {findMonthOption(periodBEndValue) ? (
            <>
              <input
                type="hidden"
                name="bEndYear"
                value={findMonthOption(periodBEndValue)?.year ?? periodB.endYear}
              />
              <input
                type="hidden"
                name="bEndMonth"
                value={findMonthOption(periodBEndValue)?.month ?? periodB.endMonth}
              />
            </>
          ) : null}
        </>
      ) : null}

      <button
        type="submit"
        disabled={showSamePeriodMessage}
        className={`rounded-full py-2 text-sm font-semibold shadow-sm transition ${
          showSamePeriodMessage
            ? "cursor-not-allowed bg-slate-200 text-slate-400"
            : "bg-emerald-700 text-white hover:bg-emerald-800"
        }`}
      >
        Actualitza
      </button>
    </form>
  );
}

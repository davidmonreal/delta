import type { YearMonth } from "../ports/reportingRepository";

export type PeriodRange = {
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
};

const monthsInYear = 12;

export function normalizePeriodRange(range: PeriodRange): PeriodRange {
  const startIndex = toMonthIndex(range.startYear, range.startMonth);
  const endIndex = toMonthIndex(range.endYear, range.endMonth);
  if (startIndex <= endIndex) return range;
  return {
    startYear: range.endYear,
    startMonth: range.endMonth,
    endYear: range.startYear,
    endMonth: range.startMonth,
  };
}

export function toMonthIndex(year: number, month: number) {
  return year * monthsInYear + (month - 1);
}

export function fromMonthIndex(index: number): YearMonth {
  const year = Math.floor(index / monthsInYear);
  const month = (index % monthsInYear) + 1;
  return { year, month };
}

export function expandPeriodMonths(range: PeriodRange): YearMonth[] {
  const normalized = normalizePeriodRange(range);
  const startIndex = toMonthIndex(normalized.startYear, normalized.startMonth);
  const endIndex = toMonthIndex(normalized.endYear, normalized.endMonth);
  const months: YearMonth[] = [];
  for (let index = startIndex; index <= endIndex; index += 1) {
    months.push(fromMonthIndex(index));
  }
  return months;
}

export function buildPeriodFromStart(
  start: YearMonth,
  length: number,
): PeriodRange {
  const normalizedLength = Math.max(1, length);
  const startIndex = toMonthIndex(start.year, start.month);
  const endIndex = startIndex + normalizedLength - 1;
  const end = fromMonthIndex(endIndex);
  return {
    startYear: start.year,
    startMonth: start.month,
    endYear: end.year,
    endMonth: end.month,
  };
}

export function getPeriodLength(range: PeriodRange) {
  const normalized = normalizePeriodRange(range);
  const startIndex = toMonthIndex(normalized.startYear, normalized.startMonth);
  const endIndex = toMonthIndex(normalized.endYear, normalized.endMonth);
  return Math.max(1, endIndex - startIndex + 1);
}

export function shiftYearMonth(base: YearMonth, offsetMonths: number): YearMonth {
  const date = new Date(base.year, base.month - 1 + offsetMonths, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function resolveQuarterRange(year: number, month: number): PeriodRange {
  const quarterIndex = Math.floor((month - 1) / 3);
  const startMonth = quarterIndex * 3 + 1;
  return {
    startYear: year,
    startMonth,
    endYear: year,
    endMonth: startMonth + 2,
  };
}

export function formatPeriodLabel(range: PeriodRange) {
  const normalized = normalizePeriodRange(range);
  const startLabel = formatMonthYear(
    normalized.startYear,
    normalized.startMonth,
  );
  const endLabel = formatMonthYear(normalized.endYear, normalized.endMonth);
  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
}

export function buildPeriodQueryParams(
  periodA: PeriodRange,
  periodB: PeriodRange,
) {
  const params = new URLSearchParams({
    aStartYear: String(periodA.startYear),
    aStartMonth: String(periodA.startMonth),
    aEndYear: String(periodA.endYear),
    aEndMonth: String(periodA.endMonth),
    bStartYear: String(periodB.startYear),
    bStartMonth: String(periodB.startMonth),
    bEndYear: String(periodB.endYear),
    bEndMonth: String(periodB.endMonth),
  });
  return params;
}

function formatMonthYear(year: number, month: number) {
  const paddedMonth = String(month).padStart(2, "0");
  return `${paddedMonth}/${year}`;
}

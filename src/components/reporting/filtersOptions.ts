import type { YearMonth } from "@/modules/reporting/ports/reportingRepository";

export type MonthOption = {
  value: string;
  label: string;
  year: number;
  month: number;
};

export type QuarterOption = {
  value: string;
  label: string;
  year: number;
  quarter: number;
  startMonth: number;
  endMonth: number;
};

export const sortMonthsDesc = (months: YearMonth[]) =>
  months.slice().sort((a, b) => b.year - a.year || b.month - a.month);

export const buildMonthOptions = (sortedMonths: YearMonth[]): MonthOption[] =>
  sortedMonths.map((entry) => {
    const value = `${entry.year}-${String(entry.month).padStart(2, "0")}`;
    const label = `${String(entry.month).padStart(2, "0")}/${entry.year}`;
    return { value, label, year: entry.year, month: entry.month };
  });

export const buildQuarterOptions = (
  sortedMonths: YearMonth[],
): QuarterOption[] => {
  const quarterMap = new Map<string, QuarterOption>();
  for (const entry of sortedMonths) {
    const quarter = Math.floor((entry.month - 1) / 3) + 1;
    const value = `${entry.year}-Q${quarter}`;
    if (!quarterMap.has(value)) {
      const startMonth = (quarter - 1) * 3 + 1;
      quarterMap.set(value, {
        value,
        label: `Q${quarter} ${entry.year}`,
        year: entry.year,
        quarter,
        startMonth,
        endMonth: startMonth + 2,
      });
    }
  }
  return Array.from(quarterMap.values()).sort(
    (a, b) => b.year - a.year || b.quarter - a.quarter,
  );
};

export const filterOptionsByValue = <T extends { value: string }>(
  options: T[],
  value: string,
) => options.filter((option) => option.value !== value);

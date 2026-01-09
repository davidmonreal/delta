import { ComparisonFiltersSchema, type ShowFilter } from "../dto/reportingSchemas";

export type ResolvedFilters = {
  year: number;
  month: number;
  previousYear: number;
  show: ShowFilter;
  showNegative: boolean;
  showEqual: boolean;
  showPositive: boolean;
  showMissing: boolean;
  showNew: boolean;
  showPercentUnder: boolean;
  showPercentEqual: boolean;
  showPercentOver: boolean;
};

export function resolveFilters({
  raw,
  defaults,
}: {
  raw: { year?: string; month?: string; show?: string };
  defaults: { year: number; month: number };
}): ResolvedFilters {
  const parsed = ComparisonFiltersSchema.safeParse(raw);
  const data = parsed.success ? parsed.data : {};
  const year = data.year ?? defaults.year;
  const month = data.month ?? defaults.month;
  const show = data.show ?? "neg";
  const previousYear = year - 1;
  const showNegative = show === "neg";
  const showEqual = show === "eq";
  const showPositive = show === "pos";
  const showMissing = show === "miss";
  const showNew = show === "new";
  const showPercentUnder = data.pctUnder ?? true;
  const showPercentEqual = data.pctEqual ?? false;
  const showPercentOver = data.pctOver ?? true;

  return {
    year,
    month,
    previousYear,
    show,
    showNegative,
    showEqual,
    showPositive,
    showMissing,
    showNew,
    showPercentUnder,
    showPercentEqual,
    showPercentOver,
  };
}

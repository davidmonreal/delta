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
  raw: {
    year?: string | string[];
    month?: string | string[];
    show?: string | string[];
    pctUnder?: string | string[];
    pctEqual?: string | string[];
    pctOver?: string | string[];
  };
  defaults: { year: number; month: number };
}): ResolvedFilters {
  // Business rule: compare the selected month against the same month of the previous year,
  // defaulting to the latest available data for the current user.
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
  // Business rule: by default we hide "equal to 3%" because it is the expected annual update.
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

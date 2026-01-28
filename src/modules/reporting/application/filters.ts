import {
  ComparisonFiltersSchema,
  type ComparisonRangeType,
  type ShowFilter,
} from "../dto/reportingSchemas";
import {
  buildPeriodFromStart,
  expandPeriodMonths,
  getPeriodLength,
  normalizePeriodRange,
  resolveQuarterRange,
  type PeriodRange,
} from "../domain/periods";
import type { YearMonth } from "../ports/reportingRepository";

export type ResolvedFilters = {
  periodA: PeriodRange;
  periodB: PeriodRange;
  periodMonthsA: YearMonth[];
  periodMonthsB: YearMonth[];
  rangeType: ComparisonRangeType;
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
    aStartYear?: string | string[];
    aStartMonth?: string | string[];
    aEndYear?: string | string[];
    aEndMonth?: string | string[];
    bStartYear?: string | string[];
    bStartMonth?: string | string[];
    bEndYear?: string | string[];
    bEndMonth?: string | string[];
    rangeType?: string | string[];
    show?: string | string[];
    pctUnder?: string | string[];
    pctEqual?: string | string[];
    pctOver?: string | string[];
  };
  defaults: { year: number; month: number };
}): ResolvedFilters {
  // Business rule: compare a selected period against another period of equal length,
  // defaulting to the latest available data for the current user.
  const parsed = ComparisonFiltersSchema.safeParse(raw);
  const data = parsed.success ? parsed.data : {};
  const referenceYear = data.year ?? defaults.year;
  const referenceMonth = data.month ?? defaults.month;
  const rangeType = resolveRangeType({
    rawRangeType: data.rangeType,
    reference: { year: referenceYear, month: referenceMonth },
    periodA: {
      startYear: data.aStartYear ?? referenceYear - 1,
      startMonth: data.aStartMonth ?? referenceMonth,
      endYear: data.aEndYear ?? referenceYear - 1,
      endMonth: data.aEndMonth ?? referenceMonth,
    },
    periodB: {
      startYear: data.bStartYear ?? referenceYear,
      startMonth: data.bStartMonth ?? referenceMonth,
      endYear: data.bEndYear ?? referenceYear,
      endMonth: data.bEndMonth ?? referenceMonth,
    },
  });
  const hasPeriodInputs =
    data.aStartYear !== undefined ||
    data.aStartMonth !== undefined ||
    data.aEndYear !== undefined ||
    data.aEndMonth !== undefined ||
    data.bStartYear !== undefined ||
    data.bStartMonth !== undefined ||
    data.bEndYear !== undefined ||
    data.bEndMonth !== undefined;

  const defaultPeriodB: PeriodRange = {
    startYear: referenceYear,
    startMonth: referenceMonth,
    endYear: referenceYear,
    endMonth: referenceMonth,
  };
  const defaultPeriodA: PeriodRange = {
    startYear: referenceYear - 1,
    startMonth: referenceMonth,
    endYear: referenceYear - 1,
    endMonth: referenceMonth,
  };

  let periodA = defaultPeriodA;
  let periodB = defaultPeriodB;

  if (hasPeriodInputs) {
    periodA = normalizePeriodRange({
      startYear: data.aStartYear ?? periodA.startYear,
      startMonth: data.aStartMonth ?? periodA.startMonth,
      endYear: data.aEndYear ?? periodA.endYear,
      endMonth: data.aEndMonth ?? periodA.endMonth,
    });
    periodB = normalizePeriodRange({
      startYear: data.bStartYear ?? periodB.startYear,
      startMonth: data.bStartMonth ?? periodB.startMonth,
      endYear: data.bEndYear ?? periodB.endYear,
      endMonth: data.bEndMonth ?? periodB.endMonth,
    });
  }

  const periodLength = getPeriodLength(periodA);
  periodB = buildPeriodFromStart(
    { year: periodB.startYear, month: periodB.startMonth },
    periodLength,
  );
  const periodMonthsA = expandPeriodMonths(periodA);
  const periodMonthsB = expandPeriodMonths(periodB);
  const show = data.show ?? "neg";
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
    periodA,
    periodB,
    periodMonthsA,
    periodMonthsB,
    rangeType,
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

function resolveRangeType({
  rawRangeType,
  reference,
  periodA,
  periodB,
}: {
  rawRangeType?: ComparisonRangeType;
  reference: YearMonth;
  periodA: PeriodRange;
  periodB: PeriodRange;
}): ComparisonRangeType {
  if (rawRangeType) return rawRangeType;
  const normalizedA = normalizePeriodRange(periodA);
  const normalizedB = normalizePeriodRange(periodB);
  const isSingleMonth =
    normalizedA.startYear === normalizedA.endYear &&
    normalizedA.startMonth === normalizedA.endMonth &&
    normalizedB.startYear === normalizedB.endYear &&
    normalizedB.startMonth === normalizedB.endMonth;
  if (isSingleMonth) return "month";
  const referenceQuarter = resolveQuarterRange(
    reference.year,
    reference.month,
  );
  const matchesQuarter =
    normalizedA.startMonth === referenceQuarter.startMonth &&
    normalizedA.endMonth === referenceQuarter.endMonth &&
    normalizedA.startYear === referenceQuarter.startYear &&
    normalizedA.endYear === referenceQuarter.endYear;
  if (matchesQuarter) return "quarter";
  return "period";
}

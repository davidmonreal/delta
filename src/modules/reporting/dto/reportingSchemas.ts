import { z } from "zod";

const CheckboxSchema = z.preprocess((value) => {
  const normalized = Array.isArray(value) ? value[value.length - 1] : value;
  if (normalized === "1" || normalized === "on" || normalized === "true") return true;
  if (normalized === "0" || normalized === "false") return false;
  return undefined;
}, z.boolean().optional());

export const ShowSchema = z.enum(["neg", "eq", "pos", "miss", "new"]);
export const ComparisonRangeTypeSchema = z.enum(["month", "quarter", "period"]);

export const ComparisonFiltersSchema = z.object({
  year: z.coerce.number().int().min(2000).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  aStartYear: z.coerce.number().int().min(2000).optional(),
  aStartMonth: z.coerce.number().int().min(1).max(12).optional(),
  aEndYear: z.coerce.number().int().min(2000).optional(),
  aEndMonth: z.coerce.number().int().min(1).max(12).optional(),
  bStartYear: z.coerce.number().int().min(2000).optional(),
  bStartMonth: z.coerce.number().int().min(1).max(12).optional(),
  bEndYear: z.coerce.number().int().min(2000).optional(),
  bEndMonth: z.coerce.number().int().min(1).max(12).optional(),
  rangeType: z.preprocess((value) => {
    const normalized = Array.isArray(value) ? value[value.length - 1] : value;
    if (normalized === "" || normalized === undefined) return undefined;
    return normalized;
  }, ComparisonRangeTypeSchema.optional()),
  show: ShowSchema.optional(),
  pctUnder: CheckboxSchema,
  pctEqual: CheckboxSchema,
  pctOver: CheckboxSchema,
});

export const ClientIdSchema = z.coerce.number().int().positive();

export type ComparisonFiltersInput = z.infer<typeof ComparisonFiltersSchema>;
export type ShowFilter = z.infer<typeof ShowSchema>;
export type ComparisonRangeType = z.infer<typeof ComparisonRangeTypeSchema>;

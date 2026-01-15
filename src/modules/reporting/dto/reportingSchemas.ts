import { z } from "zod";

const CheckboxSchema = z.preprocess((value) => {
  const normalized = Array.isArray(value) ? value[value.length - 1] : value;
  if (normalized === "1" || normalized === "on" || normalized === "true") return true;
  if (normalized === "0" || normalized === "false") return false;
  return undefined;
}, z.boolean().optional());

export const ShowSchema = z.enum(["neg", "eq", "pos", "miss", "new"]);

export const ComparisonFiltersSchema = z.object({
  year: z.coerce.number().int().min(2000).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  show: ShowSchema.optional(),
  pctUnder: CheckboxSchema,
  pctEqual: CheckboxSchema,
  pctOver: CheckboxSchema,
});

export const ClientIdSchema = z.coerce.number().int().positive();

export type ComparisonFiltersInput = z.infer<typeof ComparisonFiltersSchema>;
export type ShowFilter = z.infer<typeof ShowSchema>;

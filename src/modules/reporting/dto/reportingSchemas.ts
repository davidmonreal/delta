import { z } from "zod";

export const ShowSchema = z.enum(["neg", "eq", "pos", "miss", "new"]);

export const ComparisonFiltersSchema = z.object({
  year: z.coerce.number().int().min(2000).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  show: ShowSchema.optional(),
});

export const ClientIdSchema = z.coerce.number().int().positive();

export type ComparisonFiltersInput = z.infer<typeof ComparisonFiltersSchema>;
export type ShowFilter = z.infer<typeof ShowSchema>;

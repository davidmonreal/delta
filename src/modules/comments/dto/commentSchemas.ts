import { z } from "zod";

export const CommentKindSchema = z.enum(["REPORT_ERROR", "VALIDATE_DIFFERENCE"]);

export const CreateComparisonCommentSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  serviceId: z.coerce.number().int().positive(),
  year: z.coerce.number().int().positive(),
  month: z.coerce.number().int().min(1).max(12),
  kind: CommentKindSchema,
  message: z
    .string()
    .trim()
    .min(5, "Fes una explicació més detallada, si us plau."),
});

export type CreateComparisonCommentInput = z.infer<typeof CreateComparisonCommentSchema>;

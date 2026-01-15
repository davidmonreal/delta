import { z } from "zod";

export const ServiceLinkInputSchema = z.object({
  serviceId: z.coerce.number().int().positive(),
  linkedServiceId: z.coerce.number().int().positive(),
  offsetMonths: z.coerce.number().int().min(0).max(24),
});

export const DeleteServiceLinkSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type ServiceLinkInput = z.infer<typeof ServiceLinkInputSchema>;
export type DeleteServiceLinkInput = z.infer<typeof DeleteServiceLinkSchema>;

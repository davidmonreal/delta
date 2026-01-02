import { z } from "zod";

export const CredentialsSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

export type CredentialsInput = z.infer<typeof CredentialsSchema>;

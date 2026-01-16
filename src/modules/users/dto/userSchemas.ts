import { z } from "zod";

import { UserRoleValues } from "../domain/userRole";

export const UserRoleSchema = z.enum(UserRoleValues);

const EmailSchema = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase());

export const CreateUserSchema = z.object({
  email: EmailSchema,
  name: z.string().optional(),
  password: z.string().min(1),
  role: UserRoleSchema,
});

export const UpdateUserSchema = z.object({
  userId: z.number().int().positive(),
  email: EmailSchema,
  name: z.string().optional(),
  password: z.string().optional(),
  role: UserRoleSchema,
  managerAliases: z.array(z.string()).optional(),
});

export const DeleteUserSchema = z.object({
  userId: z.number().int().positive(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type DeleteUserInput = z.infer<typeof DeleteUserSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;

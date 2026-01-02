"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/require-auth";
import { createUser } from "@/modules/users/application/createUser";
import { updateUser } from "@/modules/users/application/updateUser";
import type { ActionResult } from "@/modules/users/application/types";
import { BcryptPasswordHasher } from "@/modules/users/infrastructure/bcryptPasswordHasher";
import { PrismaUserRepository } from "@/modules/users/infrastructure/prismaUserRepository";
import { CreateUserSchema, UpdateUserSchema } from "@/modules/users/dto/userSchemas";

type ActionState = ActionResult;

const repo = new PrismaUserRepository();
const passwordHasher = new BcryptPasswordHasher();

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createUserAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdminSession();
  const parsed = CreateUserSchema.safeParse({
    email: getString(formData, "email"),
    name: getString(formData, "name") || undefined,
    password: getString(formData, "password"),
    role: getString(formData, "role"),
  });

  if (!parsed.success) {
    return { error: "Falten camps obligatoris." };
  }

  const result = await createUser({
    input: parsed.data,
    sessionUser: { id: session.user.id, role: session.user.role },
    repo,
    passwordHasher,
  });
  if (result.error) {
    return result;
  }
  revalidatePath("/admin/users");
  return result;
}

export async function updateUserAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdminSession();
  const userIdRaw = getString(formData, "userId");
  const userId = Number.parseInt(userIdRaw, 10);
  const password = getString(formData, "password");
  const parsed = UpdateUserSchema.safeParse({
    userId,
    email: getString(formData, "email"),
    name: getString(formData, "name") || undefined,
    password: password.length ? password : undefined,
    role: getString(formData, "role"),
  });

  if (!parsed.success) {
    return { error: "Falten camps obligatoris." };
  }

  const result = await updateUser({
    input: parsed.data,
    sessionUser: { id: session.user.id, role: session.user.role },
    repo,
    passwordHasher,
  });
  if (result.error) {
    return result;
  }
  revalidatePath("/admin/users");
  return result;
}

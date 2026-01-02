import type { PasswordHasher } from "../ports/passwordHasher";
import type { UserRepository } from "../ports/userRepository";
import type { UpdateUserInput } from "../dto/userSchemas";
import { canAssignRole, canEditTarget } from "../domain/policies";
import type { ActionResult, CurrentUser } from "./types";

function normalizeName(value: string | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function updateUser({
  input,
  sessionUser,
  repo,
  passwordHasher,
}: {
  input: UpdateUserInput;
  sessionUser: CurrentUser;
  repo: UserRepository;
  passwordHasher: PasswordHasher;
}): Promise<ActionResult> {
  const target = await repo.findById(input.userId);
  if (!target) {
    return { error: "Usuari no trobat." };
  }

  if (!canEditTarget(sessionUser.role, target.role)) {
    return { error: "No tens permisos per editar superadmins." };
  }

  if (!canAssignRole(sessionUser.role, input.role)) {
    return { error: "No tens permisos per assignar superadmin." };
  }

  if (input.email !== target.email) {
    const existing = await repo.findByEmail(input.email);
    if (existing && existing.id !== target.id) {
      return { error: "Aquest email ja existeix." };
    }
  }

  const data = {
    email: input.email,
    name: normalizeName(input.name),
    role: input.role,
  } as const;

  const updateData = input.password?.length
    ? {
        ...data,
        passwordHash: await passwordHasher.hash(input.password),
      }
    : data;

  await repo.update(target.id, updateData);

  return { success: "Usuari actualitzat correctament." };
}

import type { PasswordHasher } from "../ports/passwordHasher";
import type { UserRepository } from "../ports/userRepository";
import type { CreateUserInput } from "../dto/userSchemas";
import { canAssignRole } from "../domain/policies";
import type { ActionResult, CurrentUser } from "./types";

function normalizeName(value: string | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function createUser({
  input,
  sessionUser,
  repo,
  passwordHasher,
}: {
  input: CreateUserInput;
  sessionUser: CurrentUser;
  repo: UserRepository;
  passwordHasher: PasswordHasher;
}): Promise<ActionResult> {
  if (!canAssignRole(sessionUser.role, input.role)) {
    return { error: "No tens permisos per crear superadmins." };
  }

  const existing = await repo.findByEmail(input.email);
  if (existing) {
    return { error: "Aquest email ja existeix." };
  }

  const passwordHash = await passwordHasher.hash(input.password);

  await repo.create({
    email: input.email,
    name: normalizeName(input.name),
    role: input.role,
    passwordHash,
  });

  return { success: "Usuari creat correctament." };
}

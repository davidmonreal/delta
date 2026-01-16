import type { PasswordHasher } from "../ports/passwordHasher";
import type { UserRepository } from "../ports/userRepository";
import type { CreateUserInput } from "../dto/userSchemas";
import { canAssignRole } from "../domain/policies";
import { normalizeName } from "@/lib/normalize";
import type { InvoiceCommandRepository } from "@/modules/invoices/ports/invoiceRepository";
import type { ActionResult, CurrentUser } from "./types";

function normalizeDisplayName(value: string | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function createUser({
  input,
  sessionUser,
  repo,
  passwordHasher,
  invoiceRepo,
}: {
  input: CreateUserInput;
  sessionUser: CurrentUser;
  repo: UserRepository;
  passwordHasher: PasswordHasher;
  invoiceRepo: InvoiceCommandRepository;
}): Promise<ActionResult> {
  if (!canAssignRole(sessionUser.role, input.role)) {
    return { error: "No tens permisos per crear superadmins." };
  }

  const existing = await repo.findByEmail(input.email);
  if (existing) {
    return { error: "Aquest email ja existeix." };
  }

  const normalizedAliases = input.managerAliases
    ? Array.from(
        new Set(
          input.managerAliases
            .map((alias) => alias.trim())
            .filter((alias) => alias.length > 0)
            .map((alias) => normalizeName(alias)),
        ),
      )
    : undefined;
  if (normalizedAliases && normalizedAliases.length > 0) {
    const owners = await repo.listManagerAliasOwners(normalizedAliases);
    if (owners.length > 0) {
      const conflictList = Array.from(new Set(owners.map((entry) => entry.alias)))
        .slice(0, 3)
        .join(", ");
      return {
        error: `Aquest àlies ja està assignat: ${conflictList}.`,
      };
    }
  }

  const passwordHash = await passwordHasher.hash(input.password);

  const displayName = normalizeDisplayName(input.name);
  const created = await repo.create({
    email: input.email,
    name: displayName,
    nameNormalized: displayName ? normalizeName(displayName) : null,
    role: input.role,
    passwordHash,
  });

  if (normalizedAliases && normalizedAliases.length > 0) {
    await repo.update(created.id, {
      email: created.email,
      name: created.name,
      nameNormalized: created.nameNormalized,
      role: created.role,
      managerAliases: normalizedAliases,
    });
    await Promise.all(
      normalizedAliases.map((alias) => invoiceRepo.assignManagerAlias(alias, created.id)),
    );
  }

  if (!created.nameNormalized) {
    return { success: "Usuari creat correctament." };
  }

  const assigned = await invoiceRepo.assignManagersForUser({
    userId: created.id,
    nameNormalized: created.nameNormalized,
  });

  if (assigned > 0) {
    return { success: `Usuari creat correctament. ${assigned} línies assignades.` };
  }

  return {
    success: "Usuari creat correctament. No té cap línia assignada encara.",
  };
}

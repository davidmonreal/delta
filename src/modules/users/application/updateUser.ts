import { normalizeName } from "@/lib/normalize";
import type { InvoiceRepository } from "@/modules/invoices/ports/invoiceRepository";
import type { ActionResult, CurrentUser } from "./types";
import { canAssignRole, canEditTarget } from "../domain/policies";
import type { UpdateUserInput } from "../dto/userSchemas";
import type { PasswordHasher } from "../ports/passwordHasher";
import type { UserRepository } from "../ports/userRepository";

function normalizeDisplayName(value: string | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function updateUser({
  input,
  sessionUser,
  repo,
  passwordHasher,
  invoiceRepo,
}: {
  input: UpdateUserInput;
  sessionUser: CurrentUser;
  repo: UserRepository;
  passwordHasher: PasswordHasher;
  invoiceRepo?: InvoiceRepository;
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

  const displayName = normalizeDisplayName(input.name);
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
    const conflicts = owners.filter((owner) => owner.userId !== target.id);
    if (conflicts.length > 0) {
      const conflictList = Array.from(new Set(conflicts.map((entry) => entry.alias)))
        .slice(0, 3)
        .join(", ");
      return {
        error: `Aquest àlies ja està assignat: ${conflictList}.`,
      };
    }
  }
  const data = {
    email: input.email,
    name: displayName,
    nameNormalized: displayName ? normalizeName(displayName) : null,
    role: input.role,
  } as const;

  const updateData = input.password?.length
    ? {
      ...data,
      passwordHash: await passwordHasher.hash(input.password),
    }
    : data;

  await repo.update(target.id, {
    ...updateData,
    managerAliases: normalizedAliases,
  });

  if (normalizedAliases && normalizedAliases.length > 0 && invoiceRepo) {
    await Promise.all(
      normalizedAliases.map((alias) => invoiceRepo.assignManagerAlias(alias, target.id)),
    );
  }

  return { success: "Usuari actualitzat correctament." };
}

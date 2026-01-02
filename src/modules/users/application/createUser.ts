import type { PasswordHasher } from "../ports/passwordHasher";
import type { UserRepository } from "../ports/userRepository";
import type { CreateUserInput } from "../dto/userSchemas";
import { canAssignRole } from "../domain/policies";
import { normalizeName } from "@/lib/normalize";
import type { InvoiceRepository } from "@/modules/invoices/ports/invoiceRepository";
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
  invoiceRepo: InvoiceRepository;
}): Promise<ActionResult> {
  if (!canAssignRole(sessionUser.role, input.role)) {
    return { error: "No tens permisos per crear superadmins." };
  }

  const existing = await repo.findByEmail(input.email);
  if (existing) {
    return { error: "Aquest email ja existeix." };
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

  if (!created.nameNormalized) {
    return { success: "Usuari creat correctament." };
  }

  const assigned = await invoiceRepo.assignManagersForUser({
    userId: created.id,
    nameNormalized: created.nameNormalized,
  });

  if (assigned > 0) {
    return { success: `Usuari creat correctament. ${assigned} linies assignades.` };
  }

  return {
    success: "Usuari creat correctament. No te cap linia assignada encara.",
  };
}

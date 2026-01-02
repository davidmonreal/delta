import type { UserRepository } from "../ports/userRepository";
import type { PasswordHasher } from "../ports/passwordHasher";
import type { CreateUserInput } from "../dto/userSchemas";
import { normalizeName } from "@/lib/normalize";

export type UpsertUserResult = {
  created: boolean;
};

function normalizeDisplayName(value: string | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function upsertUser({
  input,
  repo,
  passwordHasher,
}: {
  input: CreateUserInput;
  repo: UserRepository;
  passwordHasher: PasswordHasher;
}): Promise<UpsertUserResult> {
  const existing = await repo.findByEmail(input.email);
  const passwordHash = await passwordHasher.hash(input.password);
  const displayName = normalizeDisplayName(input.name);
  const nameNormalized = displayName ? normalizeName(displayName) : null;

  if (existing) {
    await repo.update(existing.id, {
      email: input.email,
      name: displayName,
      nameNormalized,
      role: input.role,
      passwordHash,
    });
    return { created: false };
  }

  await repo.create({
    email: input.email,
    name: displayName,
    nameNormalized,
    role: input.role,
    passwordHash,
  });

  return { created: true };
}

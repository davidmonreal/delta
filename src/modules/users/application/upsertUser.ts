import type { UserRepository } from "../ports/userRepository";
import type { PasswordHasher } from "../ports/passwordHasher";
import type { CreateUserInput } from "../dto/userSchemas";

export type UpsertUserResult = {
  created: boolean;
};

function normalizeName(value: string | undefined) {
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

  if (existing) {
    await repo.update(existing.id, {
      email: input.email,
      name: normalizeName(input.name),
      role: input.role,
      passwordHash,
    });
    return { created: false };
  }

  await repo.create({
    email: input.email,
    name: normalizeName(input.name),
    role: input.role,
    passwordHash,
  });

  return { created: true };
}

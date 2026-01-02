import type { UserRepository } from "../ports/userRepository";
import type { PasswordHasher } from "../ports/passwordHasher";
import type { CredentialsInput } from "../dto/authSchemas";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name?: string;
  role: "SUPERADMIN" | "ADMIN" | "USER";
};

export async function authenticateUser({
  input,
  repo,
  passwordHasher,
}: {
  input: CredentialsInput;
  repo: UserRepository;
  passwordHasher: PasswordHasher;
}): Promise<AuthenticatedUser | null> {
  const user = await repo.findByEmail(input.email);
  if (!user) {
    return null;
  }

  const isValid = await passwordHasher.compare(input.password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    id: String(user.id),
    email: user.email,
    name: user.name ?? undefined,
    role: user.role,
  };
}

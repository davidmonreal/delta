import type { UserRepository } from "../ports/userRepository";
import type { UserRole } from "../domain/userRole";
import type { CurrentUser } from "./types";

export async function listUsers({
  query,
  sessionUser,
  repo,
}: {
  query: string;
  sessionUser: CurrentUser;
  repo: UserRepository;
}) {
  const allowSuperadmin = sessionUser.role === "SUPERADMIN";
  const roles: UserRole[] = allowSuperadmin
    ? ["SUPERADMIN", "ADMIN", "USER"]
    : ["ADMIN", "USER"];
  const normalizedQuery = query.trim();
  const shouldFilter = normalizedQuery.length > 2;

  const users = await repo.list({
    roles,
    query: shouldFilter ? normalizedQuery : undefined,
  });

  return { users, allowSuperadmin };
}

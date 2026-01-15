import type { UserRepository } from "../ports/userRepository";
import type { CurrentUser } from "./types";
import { isAdminRole } from "../domain/rolePolicies";
import type { UserRole } from "../domain/userRole";

export type FilterUserOption = {
  id: number;
  label: string;
};

export async function listUsersForFilter({
  sessionUser,
  repo,
}: {
  sessionUser: CurrentUser;
  repo: UserRepository;
}): Promise<FilterUserOption[]> {
  if (!isAdminRole(sessionUser.role)) {
    return [];
  }

  const roles: UserRole[] = ["SUPERADMIN", "ADMIN", "USER"];
  const users = await repo.list({ roles });
  const options = users.map((user) => ({
    id: user.id,
    label: user.name?.trim() || user.email,
  }));

  return options.sort((a, b) => a.label.localeCompare(b.label, "ca"));
}

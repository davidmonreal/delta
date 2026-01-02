import type { UserRole } from "./userRole";
import { isAdminRole } from "./rolePolicies";

export function canSeeAdminNav(role: UserRole) {
  return isAdminRole(role);
}

export function canManageUsers(role: UserRole) {
  return isAdminRole(role);
}

import type { UserRole } from "./userRole";

export function canSeeAdminNav(role: UserRole) {
  return role === "ADMIN" || role === "SUPERADMIN";
}

export function canManageUsers(role: UserRole) {
  return role === "ADMIN" || role === "SUPERADMIN";
}

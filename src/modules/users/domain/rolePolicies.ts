import type { UserRole } from "./userRole";

export function isSuperadminRole(role: UserRole) {
  return role === "SUPERADMIN";
}

export function isAdminRole(role: UserRole) {
  return role === "ADMIN" || role === "SUPERADMIN";
}

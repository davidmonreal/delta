import type { UserRole } from "./userRole";

export function canAssignRole(actorRole: UserRole, roleToAssign: UserRole) {
  if (actorRole === "SUPERADMIN") return true;
  if (actorRole === "ADMIN" && roleToAssign !== "SUPERADMIN") return true;
  return false;
}

export function canEditTarget(actorRole: UserRole, targetRole: UserRole) {
  if (actorRole === "SUPERADMIN") return true;
  if (actorRole === "ADMIN" && targetRole !== "SUPERADMIN") return true;
  return false;
}

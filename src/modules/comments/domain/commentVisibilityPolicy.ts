import { isAdminRole } from "@/modules/users/domain/rolePolicies";
import type { UserRole } from "@/modules/users/domain/userRole";

export type CommentViewer = {
  userId: number;
  role: UserRole;
};

export type CommentVisibilityRule =
  | { type: "all" }
  | { type: "ownerOrElevated"; userId: number; roles: UserRole[] };

export function resolveCommentVisibilityRule(
  viewer: CommentViewer,
): CommentVisibilityRule {
  if (isAdminRole(viewer.role)) {
    return { type: "all" };
  }
  return { type: "ownerOrElevated", userId: viewer.userId, roles: ["ADMIN", "SUPERADMIN"] };
}

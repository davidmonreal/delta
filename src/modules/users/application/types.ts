import type { UserRole } from "../domain/userRole";

export type CurrentUser = {
  id: string;
  role: UserRole;
};

export type ActionResult = {
  error?: string;
  success?: string;
};

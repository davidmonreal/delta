import type { UserRole } from "./userRole";

export type UserEntity = {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  passwordHash: string;
  createdAt: Date;
};

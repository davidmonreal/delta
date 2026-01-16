import type { UserRole } from "./userRole";

export type UserEntity = {
  id: number;
  email: string;
  name: string | null;
  nameNormalized: string | null;
  role: UserRole;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  managerAliases?: { alias: string }[];
};

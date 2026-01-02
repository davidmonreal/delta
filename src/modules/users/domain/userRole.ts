export const UserRoleValues = ["SUPERADMIN", "ADMIN", "USER"] as const;
export type UserRole = (typeof UserRoleValues)[number];

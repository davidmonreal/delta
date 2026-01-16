import type { UserRole } from "@/modules/users/domain/userRole";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      name?: string | null;
      email?: string | null;
    };
    impersonator?: {
      id: string;
      role: UserRole;
      name?: string | null;
      email?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: UserRole;
    name?: string | null;
    email?: string | null;
    impersonatorId?: string;
    impersonatorRole?: UserRole;
    impersonatorName?: string | null;
    impersonatorEmail?: string | null;
  }
}

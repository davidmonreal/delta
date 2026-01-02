import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "SUPERADMIN" | "ADMIN" | "USER";
      email?: string | null;
      name?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: string;
  }
}

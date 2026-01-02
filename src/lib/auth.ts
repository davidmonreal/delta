import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { CredentialsSchema } from "@/modules/users/dto/authSchemas";
import { authenticateUser } from "@/modules/users/application/authenticateUser";
import { PrismaUserRepository } from "@/modules/users/infrastructure/prismaUserRepository";
import { BcryptPasswordHasher } from "@/modules/users/infrastructure/bcryptPasswordHasher";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = CredentialsSchema.safeParse({
          email: credentials?.email ?? "",
          password: credentials?.password ?? "",
        });
        if (!parsed.success) {
          return null;
        }

        const repo = new PrismaUserRepository();
        const passwordHasher = new BcryptPasswordHasher();
        return authenticateUser({
          input: parsed.data,
          repo,
          passwordHasher,
        });
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = (user as { role?: "SUPERADMIN" | "ADMIN" | "USER" }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId ?? "");
        session.user.role = token.role ?? "USER";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

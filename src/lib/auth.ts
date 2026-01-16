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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = user.id;
        token.role = (user as { role?: "SUPERADMIN" | "ADMIN" | "USER" }).role;
        token.name = user.name;
        token.email = user.email;
      }
      if (trigger === "update" && session) {
        const updatePayload = session as {
          impersonateUserId?: number;
          clearImpersonation?: boolean;
        };
        if (updatePayload.clearImpersonation && token.impersonatorId) {
          token.userId = token.impersonatorId;
          token.role = token.impersonatorRole ?? token.role;
          token.name = token.impersonatorName;
          token.email = token.impersonatorEmail;
          delete token.impersonatorId;
          delete token.impersonatorRole;
          delete token.impersonatorName;
          delete token.impersonatorEmail;
        } else if (
          updatePayload.impersonateUserId &&
          !token.impersonatorId &&
          (token.role === "ADMIN" || token.role === "SUPERADMIN")
        ) {
          try {
            const repo = new PrismaUserRepository();
            const target = await repo.findById(
              Number(updatePayload.impersonateUserId),
            );
            if (target) {
              if (token.role === "ADMIN" && target.role !== "USER") {
                return token;
              }
              token.impersonatorId = String(token.userId ?? "");
              token.impersonatorRole = token.role;
              token.impersonatorName = token.name;
              token.impersonatorEmail = token.email;

              token.userId = String(target.id);
              token.role = target.role;
              token.name = target.name ?? undefined;
              token.email = target.email;
            }
          } catch {
            return token;
          }
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId ?? "");
        session.user.role = token.role ?? "USER";
        session.user.name = token.name ?? null;
        session.user.email = token.email ?? null;
      }
      if (token.impersonatorId) {
        session.impersonator = {
          id: String(token.impersonatorId),
          role: token.impersonatorRole ?? "USER",
          name: token.impersonatorName ?? null,
          email: token.impersonatorEmail ?? null,
        };
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

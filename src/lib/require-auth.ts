import { getServerSession, type Session } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { isAdminRole, isSuperadminRole } from "@/modules/users/domain/rolePolicies";

export async function requireSession(): Promise<Session> {
  if (process.env.E2E_AUTH_BYPASS === "1") {
    return {
      user: { id: "1", role: "ADMIN" },
    } as Session;
  }
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireAdminSession(): Promise<Session> {
  if (process.env.E2E_AUTH_BYPASS === "1") {
    return {
      user: { id: "1", role: "ADMIN" },
    } as Session;
  }
  const session = await requireSession();
  if (!isAdminRole(session.user.role)) {
    redirect("/");
  }
  return session;
}

export async function requireAdminSessionApi(): Promise<Session | null> {
  if (process.env.E2E_AUTH_BYPASS === "1") {
    return {
      user: { id: "1", role: "ADMIN" },
    } as Session;
  }
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole(session.user.role)) {
    return null;
  }
  return session;
}

export async function requireSuperadminSession(): Promise<Session> {
  if (process.env.E2E_AUTH_BYPASS === "1") {
    return {
      user: { id: "1", role: "SUPERADMIN" },
    } as Session;
  }
  const session = await requireSession();
  if (!isSuperadminRole(session.user.role)) {
    redirect("/");
  }
  return session;
}

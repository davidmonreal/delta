import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/modules/users/domain/rolePolicies";

export async function requireSession() {
  if (process.env.E2E_AUTH_BYPASS === "1") {
    return {
      user: { id: "1", role: "ADMIN" },
    } as Awaited<ReturnType<typeof getServerSession>>;
  }
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireAdminSession() {
  if (process.env.E2E_AUTH_BYPASS === "1") {
    return {
      user: { id: "1", role: "ADMIN" },
    } as Awaited<ReturnType<typeof getServerSession>>;
  }
  const session = await requireSession();
  if (!isAdminRole(session.user.role)) {
    redirect("/");
  }
  return session;
}

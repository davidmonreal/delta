import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/modules/users/domain/rolePolicies";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireAdminSession() {
  const session = await requireSession();
  if (!isAdminRole(session.user.role)) {
    redirect("/");
  }
  return session;
}

import { prisma } from "@/lib/db";
import { UserRole } from "@/generated/prisma";
import { requireAdminSession } from "@/lib/require-auth";

import AdminUsersForm from "./AdminUsersForm";

export default async function AdminUsersPage() {
  const session = await requireAdminSession();
  const allowSuperadmin = session.user.role === "SUPERADMIN";
  const visibleRoles = allowSuperadmin
    ? [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.USER]
    : [UserRole.ADMIN, UserRole.USER];

  const users = await prisma.user.findMany({
    where: {
      role: { in: visibleRoles },
    },
    orderBy: [{ role: "desc" }, { email: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
          Administracio
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Gestio d'usuaris
        </h1>
        <p className="mt-2 text-base text-slate-500">
          {allowSuperadmin ? "Pots veure tots els rols." : "Nomes admins i users."}
        </p>
      </header>

      <AdminUsersForm allowSuperadmin={allowSuperadmin} />

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-sm font-semibold text-slate-500">
          Usuaris ({users.length})
        </div>
        <div className="grid gap-3">
          <div className="grid grid-cols-[2fr_1.4fr_1fr_1fr] items-center gap-4 rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <span>Email</span>
            <span>Nom</span>
            <span>Rol</span>
            <span>Alta</span>
          </div>
          {users.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-[2fr_1.4fr_1fr_1fr] items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
            >
              <span className="font-medium">{user.email}</span>
              <span>{user.name ?? "-"}</span>
              <span>{user.role}</span>
              <span>{user.createdAt.toLocaleDateString("ca-ES")}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

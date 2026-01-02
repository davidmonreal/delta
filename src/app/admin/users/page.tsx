import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-auth";

import AdminUsersForm from "./AdminUsersForm";

export default async function AdminUsersPage() {
  const session = await requireAdminSession();
  const allowSuperadmin = session.user.role === "SUPERADMIN";
  const visibleRoles = allowSuperadmin ? ["SUPERADMIN", "ADMIN", "USER"] : ["ADMIN", "USER"];

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
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Administracio</p>
          <h1>Gestio d'usuaris</h1>
          <p className="subtitle">
            {allowSuperadmin
              ? "Pots veure tots els rols."
              : "Nomes admins i users."}
          </p>
        </div>
      </header>

      <AdminUsersForm allowSuperadmin={allowSuperadmin} />

      <section className="card admin-table">
        <div className="table-header">
          <span>Usuaris ({users.length})</span>
        </div>
        <div className="table admin-table__grid">
          <div className="table-row table-head admin-table__row">
            <span>Email</span>
            <span>Nom</span>
            <span>Rol</span>
            <span>Alta</span>
          </div>
          {users.map((user) => (
            <div key={user.id} className="table-row admin-table__row">
              <span>{user.email}</span>
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

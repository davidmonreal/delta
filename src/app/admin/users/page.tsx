import { requireAdminSession } from "@/lib/require-auth";
import { listUsers } from "@/modules/users/application/listUsers";
import { PrismaUserRepository } from "@/modules/users/infrastructure/prismaUserRepository";
import { toUserRowDto } from "@/modules/users/dto/userDto";

import AdminUsersCreateModal from "./AdminUsersCreateModal";
import AdminUsersTable from "./AdminUsersTable";
import SearchInput from "@/components/common/SearchInput";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const session = await requireAdminSession();
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = resolvedSearchParams.q?.trim() ?? "";
  const repo = new PrismaUserRepository();
  const { users, allowSuperadmin } = await listUsers({
    query,
    sessionUser: { id: session.user.id, role: session.user.role },
    repo,
  });
  const serializedUsers = users.map(toUserRowDto);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Administracio
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            Gestio d'usuaris
          </h1>
          <p className="mt-2 text-base text-slate-500">
            {allowSuperadmin
              ? "Pots veure tots els rols."
              : "Nomes admins i users."}
          </p>
        </div>
        <AdminUsersCreateModal allowSuperadmin={allowSuperadmin} />
      </header>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm font-semibold text-slate-500">
            Usuaris ({users.length})
          </div>
          <form method="get" className="w-full max-w-md">
            <SearchInput
              name="q"
              placeholder="Cerca usuaris..."
              defaultValue={query}
            />
          </form>
        </div>
        <AdminUsersTable
          users={serializedUsers}
          allowSuperadmin={allowSuperadmin}
        />
      </section>
    </div>
  );
}

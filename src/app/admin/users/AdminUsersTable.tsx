"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserRound } from "lucide-react";
import { IconButton, EditIconButton } from "@/components/common/IconButton";
import { deleteUserAction, updateUserAction } from "@/app/admin/users/actions";
import type { UserRowDto } from "@/modules/users/dto/userDto";
import AdminUserFormModal from "@/app/admin/users/AdminUserFormModal";
import PaginationControls from "@/components/common/PaginationControls";

type AdminUsersTableProps = {
  users: UserRowDto[];
  allowSuperadmin: boolean;
  viewerId: number;
};

export default function AdminUsersTable({
  users,
  allowSuperadmin,
  viewerId,
}: AdminUsersTableProps) {
  const [editingUser, setEditingUser] = useState<UserRowDto | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [impersonatingId, setImpersonatingId] = useState<number | null>(null);
  const router = useRouter();
  const { update } = useSession();
  const pageSize = 20;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedUsers = users.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [users]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const canImpersonate = (user: UserRowDto) => {
    if (user.id === viewerId) return false;
    if (allowSuperadmin) return true;
    return user.role === "USER";
  };

  const handleImpersonate = async (user: UserRowDto) => {
    if (impersonatingId === user.id) return;
    setImpersonatingId(user.id);
    try {
      await update({ impersonateUserId: user.id });
      router.refresh();
    } finally {
      setImpersonatingId(null);
    }
  };

  return (
    <>
      <div className="grid gap-3">
        <div className="grid grid-cols-[1.4fr_2fr_1fr_1fr_auto] items-center gap-4 rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          <span>Nom</span>
          <span>Email</span>
          <span>Rol</span>
          <span>Data</span>
          <span className="text-right">Accions</span>
        </div>
        {pagedUsers.map((user) => (
          <div
            key={user.id}
            className="grid grid-cols-[1.4fr_2fr_1fr_1fr_auto] items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
          >
            <span className="font-medium">{user.name ?? "-"}</span>
            <span>{user.email}</span>
            <span className="capitalize">{user.role.toLowerCase()}</span>
            <span>
              {new Date(user.createdAt).toLocaleDateString("ca-ES")}
            </span>
            <div className="flex items-center justify-end gap-2">
              {canImpersonate(user) ? (
                <IconButton
                  icon={UserRound}
                  title="Suplantar usuari"
                  size="sm"
                  onClick={() => handleImpersonate(user)}
                  className={impersonatingId === user.id ? "opacity-60" : ""}
                />
              ) : null}
              <EditIconButton
                title="Editar usuari"
                onClick={() => {
                  setFormKey((prev) => prev + 1);
                  setEditingUser(user);
                }}
              />
            </div>
          </div>
        ))}
        <PaginationControls
          page={currentPage}
          totalItems={users.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
      <AdminUserFormModal
        key={formKey}
        isOpen={Boolean(editingUser)}
        title="Editar usuari"
        submitLabel="Guardar"
        allowSuperadmin={allowSuperadmin}
        deleteAction={deleteUserAction}
        initialValues={{
          userId: editingUser?.id,
          name: editingUser?.name ?? "",
          email: editingUser?.email ?? "",
          role: editingUser?.role ?? "USER",
          managerAliases: editingUser?.managerAliases ?? [],
        }}
        passwordPlaceholder="Deixa en blanc per a mantenir-la"
        onClose={() => setEditingUser(null)}
        action={updateUserAction}
      />
    </>
  );
}

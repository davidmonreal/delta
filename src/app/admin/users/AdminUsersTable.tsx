"use client";

import { useState } from "react";
import { User } from "lucide-react";

import { EditIconButton, IconButton } from "@/components/common/IconButton";
import { deleteUserAction, updateUserAction } from "@/app/admin/users/actions";
import type { UserRowDto } from "@/modules/users/dto/userDto";
import AdminUserFormModal from "@/app/admin/users/AdminUserFormModal";

type AdminUsersTableProps = {
  users: UserRowDto[];
  allowSuperadmin: boolean;
};

export default function AdminUsersTable({
  users,
  allowSuperadmin,
}: AdminUsersTableProps) {
  const [editingUser, setEditingUser] = useState<UserRowDto | null>(null);

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
        {users.map((user) => (
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
              <EditIconButton
                title="Editar usuari"
                onClick={() => setEditingUser(user)}
              />
              <IconButton
                icon={User}
                title="Suplantar usuari"
                onClick={() => {}}
              />
            </div>
          </div>
        ))}
      </div>
      <AdminUserFormModal
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
        }}
        passwordPlaceholder="Deixa en blanc per a mantenir-la"
        onClose={() => setEditingUser(null)}
        action={updateUserAction}
      />
    </>
  );
}

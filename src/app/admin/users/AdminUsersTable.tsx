"use client";

import { useActionState, useEffect, useState } from "react";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";

import { EditIconButton, IconButton } from "@/components/common/IconButton";
import { DropdownSelect } from "@/components/common/DropdownSelect";
import { updateUserAction } from "@/app/admin/users/actions";
import type { UserRowDto } from "@/modules/users/dto/userDto";

type ActionState = {
  error?: string;
  success?: string;
};

type AdminUsersTableProps = {
  users: UserRowDto[];
  allowSuperadmin: boolean;
};

const initialState: ActionState = {};

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
      {editingUser ? (
        <EditUserModal
          key={editingUser.id}
          user={editingUser}
          allowSuperadmin={allowSuperadmin}
          onClose={() => setEditingUser(null)}
        />
      ) : null}
    </>
  );
}

type EditUserModalProps = {
  user: UserRowDto;
  allowSuperadmin: boolean;
  onClose: () => void;
};

function EditUserModal({ user, allowSuperadmin, onClose }: EditUserModalProps) {
  const router = useRouter();
  const [role, setRole] = useState<UserRowDto["role"]>(user.role);
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateUserAction,
    initialState,
  );

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onClose();
    }
  }, [state, router, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-10"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
              Administracio
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              Editar usuari
            </h3>
          </div>
        </div>
        <form className="mt-6 space-y-4" action={formAction}>
          <input type="hidden" name="userId" value={user.id} />
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            Nom
            <input
              type="text"
              name="name"
              defaultValue={user.name ?? ""}
              className="h-12 rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            Rol
            <DropdownSelect
              label={null}
              options={[
                ...(allowSuperadmin
                  ? [{ label: "Superadmin", value: "SUPERADMIN" as const }]
                  : []),
                { label: "Admin", value: "ADMIN" as const },
                { label: "User", value: "USER" as const },
              ]}
              value={role}
              onChange={(value) => setRole(value ?? user.role)}
              placeholder="User"
              buttonClassName="h-12"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            Email
            <input
              type="email"
              name="email"
              required
              defaultValue={user.email}
              className="h-12 rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            Password
            <input
              type="password"
              name="password"
              placeholder="Deixa en blanc per a mantenir-la"
              className="h-12 rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <input type="hidden" name="role" value={role} />
          {state?.error ? (
            <p className="text-sm font-semibold text-red-600">{state.error}</p>
          ) : null}
          {state?.success ? (
            <p className="text-sm font-semibold text-emerald-700">
              {state.success}
            </p>
          ) : null}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
            >
              Cancel-lar
            </button>
            <button
              type="submit"
              className="rounded-full bg-emerald-700 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

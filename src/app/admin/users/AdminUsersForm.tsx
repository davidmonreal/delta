"use client";

import { useActionState } from "react";

import { createUserAction } from "@/app/admin/users/actions";

type ActionState = {
  error?: string;
  success?: string;
};

const initialState: ActionState = {};

type AdminUsersFormProps = {
  allowSuperadmin: boolean;
};

export default function AdminUsersForm({ allowSuperadmin }: AdminUsersFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createUserAction,
    initialState,
  );

  return (
    <form
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      action={formAction}
    >
      <h2 className="text-xl font-semibold text-slate-900">Crear usuari</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
          Email
          <input
            type="email"
            name="email"
            required
            className="rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
          Nom
          <input
            type="text"
            name="name"
            className="rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
          Password
          <input
            type="password"
            name="password"
            required
            className="rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
          Rol
          <select
            name="role"
            required
            defaultValue="USER"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          >
            {allowSuperadmin ? (
              <option value="SUPERADMIN">SUPERADMIN</option>
            ) : null}
            <option value="ADMIN">ADMIN</option>
            <option value="USER">USER</option>
          </select>
        </label>
      </div>
      {state?.error ? (
        <p className="mt-3 text-sm font-semibold text-red-600">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="mt-3 text-sm font-semibold text-emerald-700">
          {state.success}
        </p>
      ) : null}
      <button
        type="submit"
        className="mt-4 rounded-full bg-emerald-700 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
      >
        Crear
      </button>
    </form>
  );
}

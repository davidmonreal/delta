"use client";

import { useState } from "react";

import { createUserAction } from "@/app/admin/users/actions";
import AdminUserFormModal from "@/app/admin/users/AdminUserFormModal";

type AdminUsersCreateModalProps = {
  allowSuperadmin: boolean;
};

export default function AdminUsersCreateModal({
  allowSuperadmin,
}: AdminUsersCreateModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-emerald-700 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
      >
        Nou usuari
      </button>
      <AdminUserFormModal
        isOpen={open}
        title="Crear usuari"
        submitLabel="Crear"
        allowSuperadmin={allowSuperadmin}
        initialValues={{
          name: "",
          email: "",
          role: "USER",
        }}
        passwordRequired
        onClose={() => setOpen(false)}
        action={createUserAction}
      />
    </>
  );
}

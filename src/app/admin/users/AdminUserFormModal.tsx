"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { DropdownSelect } from "@/components/common/DropdownSelect";

type ActionState = {
  error?: string;
  success?: string;
};

type UserFormValues = {
  userId?: number;
  name?: string | null;
  email: string;
  role: "SUPERADMIN" | "ADMIN" | "USER";
};

type AdminUserFormModalProps = {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  allowSuperadmin: boolean;
  initialValues: UserFormValues;
  passwordRequired?: boolean;
  passwordPlaceholder?: string;
  autoCloseOnSuccess?: boolean;
  onClose: () => void;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
};

const initialState: ActionState = {};

export default function AdminUserFormModal({
  isOpen,
  title,
  submitLabel,
  allowSuperadmin,
  initialValues,
  passwordRequired = false,
  passwordPlaceholder,
  autoCloseOnSuccess = true,
  onClose,
  action,
}: AdminUserFormModalProps) {
  const router = useRouter();
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const requestIdRef = useRef(0);
  const [role, setRole] = useState<UserFormValues["role"]>(initialValues.role);
  const [nameValue, setNameValue] = useState(initialValues.name ?? "");
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(
    action,
    initialState,
  );

  useEffect(() => {
    if (!isOpen) return;
    setRole(initialValues.role);
    setNameValue(initialValues.name ?? "");
    setMatchCount(null);
  }, [initialValues.role, initialValues.name, isOpen]);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      if (autoCloseOnSuccess) {
        onClose();
      }
    }
  }, [state, router, onClose, autoCloseOnSuccess]);

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      nameInputRef.current?.focus();
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const trimmed = nameValue.trim();
    if (trimmed.length < 2) {
      setMatchCount(null);
      return;
    }

    const id = requestIdRef.current + 1;
    requestIdRef.current = id;
    setIsChecking(true);

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch("/api/admin/manager-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
        if (!response.ok) return;
        const data = (await response.json()) as { count?: number };
        if (requestIdRef.current === id) {
          setMatchCount(typeof data.count === "number" ? data.count : 0);
        }
      } finally {
        if (requestIdRef.current === id) {
          setIsChecking(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timeout);
    };
  }, [nameValue, isOpen]);

  if (!isOpen) return null;

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
            <h3 className="mt-2 text-xl font-semibold text-slate-900">{title}</h3>
          </div>
        </div>
        <form className="mt-6 space-y-4" action={formAction} autoComplete="off">
          {initialValues.userId ? (
            <input type="hidden" name="userId" value={initialValues.userId} />
          ) : null}
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            Nom
            <input
              type="text"
              name="name"
              ref={nameInputRef}
              autoFocus
              value={nameValue}
              onChange={(event) => setNameValue(event.target.value)}
              autoComplete="name"
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
              onChange={(value) => setRole(value ?? initialValues.role)}
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
              defaultValue={initialValues.email}
              autoComplete="off"
              className="h-12 rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            Password
            <input
              type="password"
              name="password"
              required={passwordRequired}
              placeholder={passwordPlaceholder}
              autoComplete="new-password"
              autoCorrect="off"
              spellCheck={false}
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
          ) : matchCount !== null ? (
            <p className="text-sm font-semibold text-slate-600">
              {isChecking
                ? "Comprovant coincidencies..."
                : matchCount > 0
                  ? `Aquest usuari s'assignara a ${matchCount} linies.`
                  : "Aquest usuari no apareix en cap linia encara."}
            </p>
          ) : null}
          <div className="flex items-center justify-end gap-3">
            {state?.success ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-emerald-700 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                OK
              </button>
            ) : (
              <>
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
                  {submitLabel}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

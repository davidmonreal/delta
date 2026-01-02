"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

type AppHeaderProps = {
  showAdminLink: boolean;
  showUnmatchedLink: boolean;
  role: string;
  name?: string | null;
  email?: string | null;
};

export default function AppHeader({
  showAdminLink,
  showUnmatchedLink,
  role,
  name,
  email,
}: AppHeaderProps) {
  const displayName = name?.trim() || email || "";

  return (
    <nav className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-sm font-semibold tracking-[0.08em] text-slate-700">
          Inici
        </Link>
        {showAdminLink ? (
          <Link href="/admin/users" className="text-sm font-medium text-slate-500 hover:text-emerald-700">
            Usuaris
          </Link>
        ) : null}
        {showUnmatchedLink ? (
          <Link
            href="/admin/unmatched"
            className="text-sm font-medium text-slate-500 hover:text-emerald-700"
          >
            Importar dades
          </Link>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.2em] text-emerald-800">
          {role}
        </span>
        <span>{displayName}</span>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-full border border-slate-200 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.12em] text-slate-600 hover:border-slate-300 hover:text-slate-800"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

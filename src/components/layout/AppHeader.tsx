"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import type { UserRole } from "@/modules/users/domain/userRole";

type AppHeaderProps = {
  showAdminLink: boolean;
  showUploadLink: boolean;
  showLinkedServicesLink: boolean;
  role: UserRole;
  name?: string | null;
  email?: string | null;
  impersonator?: {
    id: string;
    role: UserRole;
    name?: string | null;
    email?: string | null;
  };
};

export default function AppHeader({
  showAdminLink,
  showUploadLink,
  showLinkedServicesLink,
  role,
  name,
  email,
  impersonator,
}: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { update } = useSession();
  const displayName = name?.trim() || email || "";
  const baseClass = "text-sm font-medium text-slate-500 hover:text-emerald-700";
  const activeClass = "text-sm font-semibold text-slate-900";
  const isHome = pathname === "/" || pathname.startsWith("/client");
  const isUsers = pathname.startsWith("/admin/users");
  const isUpload = pathname.startsWith("/admin/upload");
  const isLinkedServices = pathname.startsWith("/admin/linked-services");
  const isImpersonating = Boolean(impersonator);

  return (
    <nav className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className={`${isHome ? activeClass : baseClass} tracking-[0.08em]`}
        >
          Inici
        </Link>
        {showAdminLink ? (
          <Link href="/admin/users" className={isUsers ? activeClass : baseClass}>
            Usuaris
          </Link>
        ) : null}
        {showUploadLink ? (
          <Link href="/admin/upload" className={isUpload ? activeClass : baseClass}>
            Upload
          </Link>
        ) : null}
        {showLinkedServicesLink ? (
          <Link
            href="/admin/linked-services"
            className={isLinkedServices ? activeClass : baseClass}
          >
            Serveis vinculats
          </Link>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.2em] text-emerald-800">
          {role}
        </span>
        {isImpersonating ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.12em] text-amber-900">
            Suplantant {displayName}
          </span>
        ) : (
          <span>{displayName}</span>
        )}
        {isImpersonating ? (
          <button
            type="button"
            onClick={async () => {
              await update({ clearImpersonation: true });
              router.refresh();
            }}
            className="rounded-full border border-amber-200 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.12em] text-amber-800 hover:border-amber-300 hover:text-amber-900"
          >
            Deixar de suplantar
          </button>
        ) : null}
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

import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Delta - Comparador de Facturacio",
  description: "Comparatives mensuals per client i servei.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const showAdminLink =
    session?.user.role === "ADMIN" || session?.user.role === "SUPERADMIN";

  return (
    <html lang="ca">
      <body className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#ffffff,_#f5f7fb_60%,_#eef2f7)] text-slate-900">
        {session ? (
          <nav className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-6 py-3 backdrop-blur">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm font-semibold tracking-[0.08em] text-slate-700">
                Busbac
              </Link>
              {showAdminLink ? (
                <Link href="/admin/users" className="text-sm font-medium text-slate-500 hover:text-emerald-700">
                  Usuaris
                </Link>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.2em] text-emerald-800">
                {session.user.role}
              </span>
              <span>{session.user.email}</span>
            </div>
          </nav>
        ) : null}
        {children}
      </body>
    </html>
  );
}

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
      <body>
        {session ? (
          <nav className="top-nav">
            <div className="top-nav__left">
              <Link href="/" className="top-nav__brand">
                Busbac
              </Link>
              {showAdminLink ? (
                <Link href="/admin/users" className="top-nav__link">
                  Usuaris
                </Link>
              ) : null}
            </div>
            <div className="top-nav__right">
              <span className="top-nav__role">{session.user.role}</span>
              <span className="top-nav__email">{session.user.email}</span>
            </div>
          </nav>
        ) : null}
        {children}
      </body>
    </html>
  );
}

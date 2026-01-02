import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import AppHeader from "@/components/layout/AppHeader";
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
          <AppHeader
            showAdminLink={showAdminLink}
            role={session.user.role}
            name={session.user.name}
            email={session.user.email}
          />
        ) : null}
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import AppHeader from "@/components/layout/AppHeader";
import { canSeeAdminNav, canSeeLinkedServices } from "@/modules/users/domain/uiPolicies";
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
  const showAdminLink = session ? canSeeAdminNav(session.user.role) : false;
  const showUploadLink = showAdminLink;
  const showLinkedServicesLink = session
    ? canSeeLinkedServices(session.user.role)
    : false;

  return (
    <html lang="ca">
      <body className="min-h-screen bg-slate-100 text-slate-900">
        {session ? (
          <AppHeader
            showAdminLink={showAdminLink}
            showUploadLink={showUploadLink}
            showLinkedServicesLink={showLinkedServicesLink}
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

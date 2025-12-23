import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Delta - Comparador de Facturacio",
  description: "Comparatives mensuals per client i servei.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ca">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edulab Réservations",
  description: "Système de réservation d'équipements Edulab",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

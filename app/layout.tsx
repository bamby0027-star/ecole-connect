
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "École Connect",
  description: "Application de gestion scolaire",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
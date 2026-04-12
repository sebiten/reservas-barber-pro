import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "BarberFlow",
  description:
    "Reservas por barbero con seña o pago total, autenticación con Clerk y base de datos en Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="es" className="h-full antialiased">
        <body className="min-h-full bg-[var(--color-ink)] text-[var(--color-cream)]">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Primer Encuentro de Condominios - Registro y Mesas",
  description: "Sistema de Registro, Gestión de Asistencia y Asignación de Mesas Temáticas del Encuentro de Condominios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-[#0b111e] text-[#f4f4f4] min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}

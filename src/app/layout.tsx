import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter as requested/standard
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OperApp - Gestión de Obras Civiles",
  description: "Sistema de gestión para operación de obras civiles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className + " relative min-h-screen"}>
        {/* Subtle Corner Logos */}
        <div className="fixed top-4 left-4 w-16 h-16 opacity-10 pointer-events-none z-50">
          <img src="/logo_operapp_final.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div className="fixed top-4 right-4 w-16 h-16 opacity-10 pointer-events-none z-50">
          <img src="/logo_operapp_final.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div className="fixed bottom-4 left-4 w-16 h-16 opacity-10 pointer-events-none z-50">
          <img src="/logo_operapp_final.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div className="fixed bottom-4 right-4 w-16 h-16 opacity-10 pointer-events-none z-50">
          <img src="/logo_operapp_final.png" alt="Logo" className="w-full h-full object-contain" />
        </div>

        {children}
      </body>
    </html>
  );
}

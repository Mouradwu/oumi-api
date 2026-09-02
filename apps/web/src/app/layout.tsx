import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["600", "700"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "BLOODZ - Don de sang",
  description: "Application algérienne de don de sang — connecter les donneurs et les personnes qui en ont besoin, en temps réel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${sora.variable} ${inter.variable} font-sans`}>
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

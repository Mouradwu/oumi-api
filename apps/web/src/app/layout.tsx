import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ThemeProvider } from "@/context/ThemeContext";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["600", "700"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "BLOODZ - Don de sang",
  description: "Application algérienne de don de sang — connecter les donneurs et les personnes qui en ont besoin, en temps réel.",
};

// Applique la classe .dark AVANT la peinture initiale (script bloquant,
// execute avant l'hydratation React) pour eviter tout flash du mauvais
// theme au chargement.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('bloodz_theme') || 'system';
    var resolved = stored === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : stored;
    if (resolved === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${sora.variable} ${inter.variable} font-sans`} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

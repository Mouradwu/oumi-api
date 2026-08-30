import type { Metadata } from "next";
import { Inter, Tajawal } from "next/font/google";
import "./globals.css";

// Police pour le français/anglais
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Police pour l'arabe (moderne et élégante)
const tajawal = Tajawal({
  weight: ["300", "400", "500", "700", "800"],
  subsets: ["arabic"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Oumi - Sauvez des vies en Algérie",
  description:
    "La première plateforme algérienne qui connecte les donneurs de sang avec ceux qui en ont besoin, en temps réel.",
  keywords: [
    "don de sang",
    "Algérie",
    "wilayas",
    "urgence",
    "santé",
    "oumi",
    "blood donation",
    "algeria",
  ],
  authors: [{ name: "Oumi Team" }],
  openGraph: {
    title: "Oumi - Sauvez des vies en Algérie",
    description:
      "Connectez-vous avec des donneurs de sang à travers les 58 wilayas d'Algérie.",
    type: "website",
    locale: "fr_DZ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      dir="ltr"
      className={`${inter.variable} ${tajawal.variable} dark`}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🩸</text></svg>" />
      </head>
      <body className="antialiased bg-[#0a0a0f] text-white">
        {children}
      </body>
    </html>
  );
}
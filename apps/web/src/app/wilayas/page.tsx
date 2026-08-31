"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { translations, type Lang } from "@/lib/translations";

interface Wilaya {
  id: number;
  code: string;
  name_fr: string;
  name_ar: string;
  latitude: number;
  longitude: number;
}

export default function WilayasPage() {
  const [lang, setLang] = useState<Lang>("fr");
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const t = translations[lang];
  const isRTL = lang === "ar";

  useEffect(() => {
    fetch("https://oumiapi-production.up.railway.app/wilayas")
      .then((res) => res.json())
      .then((data) => {
        setWilayas(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur wilayas:", err);
        setWilayas([]);
        setLoading(false);
      });
  }, []);

  const filteredWilayas = wilayas.filter((w) => {
    const query = search.toLowerCase();
    return (
      w.name_fr.toLowerCase().includes(query) ||
      w.name_ar.includes(query) ||
      w.code.includes(query)
    );
  });

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-[#0a0a0f] text-white"
      style={{ fontFamily: isRTL ? "var(--font-tajawal)" : "var(--font-inter)" }}
    >
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
      </div>
      <header className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-black/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/"><Logo size={28} /></Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm text-white/70 hover:text-white transition">Accueil</Link>
            <Link href="/wilayas" className="text-sm text-white/70 hover:text-white transition">Wilayas</Link>
            <Link href="/auth/login" className="text-sm text-white/70 hover:text-white transition">Connexion</Link>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => setLang(lang === "fr" ? "ar" : "fr")} className="px-3 py-1.5 text-xs font-medium border border-white/10 rounded-full hover:bg-white/5 transition">{lang === "fr" ? "العربية" : "FR"}</button>
            <Link href="/auth/register" className="px-4 py-1.5 text-xs font-medium bg-white text-black rounded-full hover:bg-white/90 transition">Inscription</Link>
          </div>
        </div>
      </header>
      <main className="relative z-10 container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{isRTL ? "الولايات" : "Les wilayas"}</h1>
          <input
            type="text"
            placeholder={isRTL ? "بحث..." : "Rechercher..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white placeholder-white/40 focus:outline-none focus:border-red-500/50"
          />
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : filteredWilayas.length === 0 ? (
          <div className="text-center py-20 text-white/50">{isRTL ? "لا توجد ولايات" : "Aucune wilaya trouvée"}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredWilayas.map((w) => (
              <Link key={w.id} href={"/wilayas/" + w.code} className="group p-4 border border-white/5 rounded-xl hover:border-red-500/30 hover:bg-red-500/5 transition">
                <div className="text-xs text-white/40 mb-1">{w.code}</div>
                <div className="text-sm font-medium truncate">{isRTL ? w.name_ar : w.name_fr}</div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <footer className="relative z-10 border-t border-white/5 py-8 mt-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <Logo size={20} />
          <div className="text-xs text-white/40">{t?.footer?.tagline || "OUMI - Don de sang"}</div>
          <div className="text-xs text-white/30">{t?.footer?.rights || "© 2026 Tous droits réservés"}</div>
        </div>
      </footer>
    </div>
  );
}
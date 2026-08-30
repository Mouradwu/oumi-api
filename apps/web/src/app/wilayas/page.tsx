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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://oumiapi-production.up.railway.app";

  useEffect(() => {
    fetch(`${API_URL}/wilayas`)
      .then((res) => res.json())
      .then((data) => {
        setWilayas(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [API_URL]);

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
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-black/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <Logo size={28} />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm text-white/70 hover:text-white transition">
              {t.nav.home}
            </Link>
            <Link href="/wilayas" className="text-sm text-white font-medium">
              {t.nav.wilayas}
            </Link>
            <Link href="/auth/login" className="text-sm text-white/70 hover:text-white transition">
              {t.nav.login}
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
              className="px-3 py-1.5 text-xs font-medium border border-white/10 rounded-full hover:bg-white/5 transition"
            >
              {lang === "fr" ? "العربية" : "FR"}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 container mx-auto px-6 py-16 text-center">
        <div className="inline-block mb-6 px-4 py-1.5 text-xs tracking-wider uppercase border border-white/10 rounded-full text-white/60">
          {isRTL ? "69 ولاية" : "69 Wilayas"}
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          {isRTL ? "استكشف الولايات" : "Explorer les Wilayas"}
        </h1>
        <p className="text-lg text-white/60 max-w-xl mx-auto mb-10">
          {isRTL
            ? "اكتشف جميع الولايات الجزائرية وتواصل مع المتبرعين في منطقتك"
            : "Découvrez toutes les wilayas algériennes et connectez-vous avec les donneurs de votre région"}
        </p>

        {/* Search */}
        <div className="max-w-md mx-auto">
          <input
            type="text"
            placeholder={isRTL ? "ابحث عن ولاية..." : "Rechercher une wilaya..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-6 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 transition"
          />
        </div>
      </section>

      {/* Wilayas Grid */}
      <section className="relative z-10 container mx-auto px-6 py-12">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredWilayas.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            {isRTL ? "لم يتم العثور على نتائج" : "Aucun résultat trouvé"}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredWilayas.map((wilaya) => (
              <Link
                key={wilaya.id}
                href={`/wilayas/${wilaya.code}`}
                className="group p-6 border border-white/5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] hover:border-red-500/30 transition"
              >
                <div className="text-xs text-white/40 mb-2">{wilaya.code}</div>
                <div className="text-lg font-semibold mb-1">
                  {isRTL ? wilaya.name_ar : wilaya.name_fr}
                </div>
                <div className="text-xs text-white/30">
                  {isRTL ? wilaya.name_fr : wilaya.name_ar}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 mt-20">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <Logo size={20} />
          <div className="text-xs text-white/40">{t.footer.tagline}</div>
          <div className="text-xs text-white/30">{t.footer.rights}</div>
        </div>
      </footer>
    </div>
  );
}
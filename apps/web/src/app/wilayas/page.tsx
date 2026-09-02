"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { translations, type Lang } from "@/lib/translations";
import { API_URL } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
    fetch(`${API_URL}/wilayas`)
      .then((res) => res.json())
      .then((data) => {
        setWilayas(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setWilayas([]);
        setLoading(false);
      });
  }, []);

  const filteredWilayas = wilayas.filter((w) => {
    const q = search.toLowerCase();
    return w.name_fr.toLowerCase().includes(q) || w.name_ar.includes(q) || w.code.includes(q);
  });

  return (
    <ErrorBoundary fallbackTitle="Erreur d'affichage des wilayas">
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-paper text-ink pb-safe-nav">
      <Header />
      <main className="container mx-auto px-5 md:px-6 py-8 max-w-4xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="font-display text-2xl font-bold text-ink">{isRTL ? "الولايات" : "Les wilayas"}</h1>
          <input
            type="text" placeholder={isRTL ? "بحث..." : "Rechercher..."} value={search} onChange={e => setSearch(e.target.value)}
            className="w-full md:w-64 px-4 py-2 bg-surface border border-line rounded-full text-ink placeholder-slate focus:outline-none focus:border-brand text-sm"
          />
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{[...Array(12)].map((_, i) => <div key={i} className="h-20 bg-mist rounded-2xl animate-pulse" />)}</div>
        ) : filteredWilayas.length === 0 ? (
          <div className="text-center py-20 text-slate text-sm">{isRTL ? "لا توجد ولايات" : "Aucune wilaya trouvée"}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredWilayas.map((w) => (
              <Link key={w.id} href={"/wilayas/" + w.code} className="p-4 bg-surface border border-line rounded-2xl hover:border-brand/30 transition-colors">
                <div className="text-xs text-slate mb-1">{w.code}</div>
                <div className="text-sm font-medium text-ink truncate">{isRTL ? w.name_ar : w.name_fr}</div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
    </ErrorBoundary>
  );
}

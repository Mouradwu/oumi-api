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
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const t = translations[lang];
  const isRTL = lang === "ar";

  useEffect(() => {
    fetch("https://oumiapi-production.up.railway.app/wilayas")
      .then((res) => res.json())
      .then((data) => {
        setWilayas(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur wilayas:", err);
        setLoading(false);
      });
  }, []);

  const getLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("La gÃ©olocalisation n'est pas supportÃ©e par votre navigateur.");
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      (error) => {
        setLocationError(error.message);
        setLocationLoading(false);
      }
    );
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const filtered = wilayas.filter(w => {
    const q = search.toLowerCase();
    return w.name_fr.toLowerCase().includes(q) || w.name_ar.includes(q) || w.code.includes(q);
  });

  const sortedWilayas = userLocation
    ? [...filtered].sort((a, b) => {
        const dA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
        const dB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
        return dA - dB;
      })
    : filtered;

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-[#0a0a0f] text-white" style={{ fontFamily: isRTL ? "var(--font-tajawal)" : "var(--font-inter)" }}>
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
            <button onClick={() => setLang(lang === "fr" ? "ar" : "fr")} className="px-3 py-1.5 text-xs font-medium border border-white/10 rounded-full hover:bg-white/5 transition">{lang === "fr" ? "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©" : "FR"}</button>
            <Link href="/donor/register" className="px-4 py-1.5 text-xs font-medium bg-white text-black rounded-full hover:bg-white/90 transition">Inscription</Link>
          </div>
        </div>
      </header>
      <main className="relative z-10 container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{isRTL ? "Ø§Ù„ÙˆÙ„Ø§ÙŠØ§Øª" : "Les wilayas"}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <input type="text" placeholder={isRTL ? "Ø¨Ø­Ø«..." : "Rechercher..."} value={search} onChange={e => setSearch(e.target.value)} className="w-full md:w-64 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white placeholder-white/40 focus:outline-none focus:border-red-500/50" />
            <button onClick={getLocation} disabled={locationLoading} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-medium disabled:opacity-50 transition">
              {locationLoading ? "â³" : "ðŸ“"} {isRTL ? "Ù…ÙˆÙ‚Ø¹ÙŠ" : "Me localiser"}
            </button>
          </div>
        </div>
        {locationError && <div className="text-red-500 text-sm mb-4">âš ï¸ {locationError}</div>}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : sortedWilayas.length === 0 ? (
          <div className="text-center py-20 text-white/50">{isRTL ? "Ù„Ø§ ØªÙˆØ¬Ø¯ ÙˆÙ„Ø§ÙŠØ§Øª" : "Aucune wilaya trouvÃ©e"}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedWilayas.map(w => (
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
          <div className="text-xs text-white/30">{t?.footer?.rights || "Â© 2026 Tous droits rÃ©servÃ©s"}</div>
        </div>
      </footer>
    </div>
  );
}
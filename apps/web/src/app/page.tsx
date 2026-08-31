"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { translations, type Lang } from "@/lib/translations";
import { useAuth } from "@/context/AuthContext";

interface Wilaya {
  id: number;
  code: string;
  name_fr: string;
  name_ar: string;
}

export default function Home() {
  const { user, logout } = useAuth();
  const [lang, setLang] = useState<Lang>("fr");
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [loading, setLoading] = useState(true);
  const [donorsCount, setDonorsCount] = useState(0);
  const [requestsCount, setRequestsCount] = useState(0);

  const t = translations[lang];
  const isRTL = lang === "ar";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wilayasRes, donorsRes, requestsRes] = await Promise.all([
          fetch("https://oumiapi-production.up.railway.app/wilayas"),
          fetch("https://oumiapi-production.up.railway.app/donors"),
          fetch("https://oumiapi-production.up.railway.app/requests")
        ]);
        const wilayasData = await wilayasRes.json();
        const donorsData = await donorsRes.json();
        const requestsData = await requestsRes.json();
        setWilayas(wilayasData);
        setDonorsCount(Array.isArray(donorsData) ? donorsData.length : 0);
        setRequestsCount(Array.isArray(requestsData) ? requestsData.length : 0);
      } catch (err) {
        console.error("Erreur chargement des donnÃ©es:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden"
      style={{ fontFamily: isRTL ? "system-ui" : "Inter, system-ui" }}
    >
      {/* Bandeau de debug */}
      <div style={{ backgroundColor: "#222", color: "lime", textAlign: "center", padding: "8px", fontSize: "14px" }}>
        {loading ? "â³ Chargement..." : "âœ… Wilayas: " + wilayas.length + ", Donneurs: " + donorsCount + ", Demandes: " + requestsCount}
      </div>

      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-black/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Logo size={28} />
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm text-white/70 hover:text-white transition">
              {t.nav.home}
            </Link>
            <Link href="/wilayas" className="text-sm text-white/70 hover:text-white transition">
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
              {lang === "fr" ? "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©" : "FR"}
            </button>
            {user ? (
              <>
                <span className="text-sm text-white/80">
                  Bonjour {user.first_name}
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-red-400 hover:text-red-300 transition"
                >
                  DÃ©connexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm text-white/70 hover:text-white transition"
                >
                  {t.nav.login}
                </Link>
                <Link
                  href="/donor/register"
                  className="px-4 py-1.5 text-xs font-medium bg-white text-black rounded-full hover:bg-white/90 transition"
                >
                  {t.nav.register}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 container mx-auto px-6 py-24 md:py-32 text-center">
        <div className="inline-block mb-6 px-4 py-1.5 text-xs tracking-wider uppercase border border-white/10 rounded-full text-white/60">
          {isRTL ? "Ø§Ù„Ù…Ù†ØµØ© Ø§Ù„Ø£ÙˆÙ„Ù‰ ÙÙŠ Ø§Ù„Ø¬Ø²Ø§Ø¦Ø±" : "Plateforme nÂ°1 en AlgÃ©rie"}
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
          {t.hero.title}
          <br />
          <span className="bg-gradient-to-r from-red-400 to-rose-600 bg-clip-text text-transparent">
            {t.hero.subtitle}
          </span>
        </h1>
        <p className="text-lg text-white/60 max-w-xl mx-auto mb-10 leading-relaxed">
          {t.hero.description}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/donor/register"
            className="px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-white/90 transition"
          >
            {t.hero.ctaPrimary}
          </Link>
          <Link
            href="/wilayas"
            className="px-6 py-3 border border-white/10 rounded-full font-medium hover:bg-white/5 transition"
          >
            {t.hero.ctaSecondary} â†’
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 container mx-auto px-6 py-16">
        <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            { value: wilayas.length || "0", label: t.stats.wilayas },
            { value: donorsCount.toString(), label: t.stats.donors },
            { value: requestsCount.toString(), label: t.stats.lives },
          ].map((stat, i) => (
            <div
              key={i}
              className="text-center p-6 border border-white/5 rounded-2xl bg-white/[0.02] backdrop-blur"
            >
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-xs text-white/40 mt-2 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight">
          {t.features.title}
        </h2>
        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {t.features.items.map((item, i) => (
            <div
              key={i}
              className="group p-8 border border-white/5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Wilayas preview */}
      <section className="relative z-10 container mx-auto px-6 py-20 border-t border-white/5">
        <div className="flex justify-between items-end mb-10">
          <div>
            <div className="text-xs text-white/40 uppercase tracking-wider mb-2">
              {isRTL ? "Ø§Ù„ØªØºØ·ÙŠØ©" : "Couverture"}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              {t.nav.wilayas}
            </h2>
          </div>
          <Link href="/wilayas" className="text-sm text-white/60 hover:text-white transition">
            {isRTL ? "Ø¹Ø±Ø¶ Ø§Ù„ÙƒÙ„ â†’" : "Voir tout â†’"}
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {wilayas.slice(0, 6).map((w) => (
              <Link
                key={w.id}
                href={"/wilayas/" + w.code}
                className="group p-4 border border-white/5 rounded-xl hover:border-red-500/30 hover:bg-red-500/5 transition"
              >
                <div className="text-xs text-white/40 mb-1">{w.code}</div>
                <div className="text-sm font-medium truncate">
                  {isRTL ? w.name_ar : w.name_fr}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <Logo size={20} />
          <div className="text-xs text-white/40">{t.footer.tagline}</div>
          <div className="text-xs text-white/30">{t.footer.rights}</div>
        </div>
      </footer>
    </div>
  );
}
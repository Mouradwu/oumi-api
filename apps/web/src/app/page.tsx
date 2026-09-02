"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { translations, type Lang } from "@/lib/translations";
import { API_URL } from "@/lib/api";

export default function Home() {
  const [lang, setLang] = useState<Lang>("fr");
  const [donorsCount, setDonorsCount] = useState(0);
  const [requestsCount, setRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const t = translations[lang];
  const isRTL = lang === "ar";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [donorsRes, requestsRes] = await Promise.all([
          fetch(`${API_URL}/donors`),
          fetch(`${API_URL}/requests`)
        ]);
        const donorsData = await donorsRes.json();
        const requestsData = await requestsRes.json();
        setDonorsCount(Array.isArray(donorsData) ? donorsData.length : 0);
        setRequestsCount(Array.isArray(requestsData) ? requestsData.length : 0);
      } catch (err) {
        console.error("Erreur chargement des données:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden" style={{ fontFamily: isRTL ? "system-ui" : "Inter, system-ui" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-black/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Logo size={28} />
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm text-white/70 hover:text-white transition">{t.nav.home}</Link>
            <Link href="/explorer" className="text-sm text-white/70 hover:text-white transition">Explorer</Link>
            <Link href="/auth/login" className="text-sm text-white/70 hover:text-white transition">{t.nav.login}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => setLang(lang === "fr" ? "ar" : "fr")} className="px-3 py-1.5 text-xs font-medium border border-white/10 rounded-full hover:bg-white/5 transition">{lang === "fr" ? "العربية" : "FR"}</button>
            <Link href="/donor/register" className="px-4 py-1.5 text-xs font-medium bg-white text-black rounded-full hover:bg-white/90 transition">Devenir donneur</Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 container mx-auto px-6 py-24 md:py-32 text-center">
        <div className="inline-block mb-6 px-4 py-1.5 text-xs tracking-wider uppercase border border-white/10 rounded-full text-white/60">{isRTL ? "منصة التبرع بالدم" : "Plateforme de don de sang"}</div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">{t.hero.title}<br /><span className="bg-gradient-to-r from-red-400 to-rose-600 bg-clip-text text-transparent">{t.hero.subtitle}</span></h1>
        <p className="text-lg text-white/60 max-w-xl mx-auto mb-10 leading-relaxed">{t.hero.description}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/donor/register" className="px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-white/90 transition">{t.hero.ctaPrimary}</Link>
          <Link href="/explorer" className="px-6 py-3 border border-white/10 rounded-full font-medium hover:bg-white/5 transition">{t.hero.ctaSecondary} →</Link>
        </div>
      </section>

      <section className="relative z-10 container mx-auto px-6 py-16">
        <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            { value: loading ? "..." : (donorsCount + requestsCount).toString(), label: t.stats.wilayas },
            { value: loading ? "..." : donorsCount.toString(), label: t.stats.donors },
            { value: loading ? "..." : requestsCount.toString(), label: t.stats.lives },
          ].map((stat, i) => (
            <div key={i} className="text-center p-6 border border-white/5 rounded-2xl bg-white/[0.02] backdrop-blur">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">{stat.value}</div>
              <div className="text-xs text-white/40 mt-2 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 container mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight">{t.features.title}</h2>
        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {t.features.items.map((item, i) => {
            const href = item.icon === "📍" ? "/facilities" : item.icon === "⚡" ? "/requester/register" : "/donor/register";
            return (
            <Link key={i} href={href} className="group p-8 border border-white/5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition block">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
            </Link>
          );})}
        </div>
      </section>

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

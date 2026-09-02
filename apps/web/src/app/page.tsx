"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { BottomNav } from "@/components/BottomNav";
import { translations, type Lang } from "@/lib/translations";
import { API_URL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const FEATURE_ICONS: Record<string, string> = {
  "⚡": "M13 2 3 14h7l-1 8 10-12h-7l1-8Z",
  "🛡️": "M12 3 4 6.5V12c0 4.9 3.4 9.4 8 10.5 4.6-1.1 8-5.6 8-10.5V6.5L12 3Z",
  "📍": "M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
};

export default function Home() {
  const { user } = useAuth();
  const [lang, setLang] = useState<Lang>("fr");
  const [donorsCount, setDonorsCount] = useState(0);
  const [requestsCount, setRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);

  const t = translations[lang];
  const isRTL = lang === "ar";

  useEffect(() => {
    fetch(`${API_URL}/campaigns`)
      .then((res) => res.json())
      .then((data) => setActiveCampaign(Array.isArray(data) && data.length > 0 ? data[0] : null))
      .catch(() => setActiveCampaign(null));
  }, []);

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
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-paper text-ink pb-safe-nav">
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur-md border-b border-line">
        <div className="container mx-auto px-5 md:px-6 h-16 flex justify-between items-center">
          <Logo size={26} />
          <nav className="hidden md:flex items-center gap-7">
            <Link href="/" className="text-sm text-slate hover:text-ink transition-colors">{t.nav.home}</Link>
            <Link href="/explorer" className="text-sm text-slate hover:text-ink transition-colors">Explorer</Link>
            <Link href="/compatibility" className="text-sm text-slate hover:text-ink transition-colors">Compatibilité</Link>
            {!user && <Link href="/auth/login" className="text-sm text-slate hover:text-ink transition-colors">{t.nav.login}</Link>}
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => setLang(lang === "fr" ? "ar" : "fr")} className="px-3 py-1.5 text-xs font-medium border border-line rounded-full text-slate hover:text-ink hover:border-slate transition-colors">
              {lang === "fr" ? "العربية" : "FR"}
            </button>
            {user ? (
              <Link href="/profile" className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-mist transition-colors">
                <span className="w-7 h-7 rounded-full bg-brand-light text-brand-dark text-xs font-semibold flex items-center justify-center">
                  {user.first_name?.[0]?.toUpperCase() || "?"}
                </span>
                <span className="text-sm text-ink font-medium hidden sm:inline">{user.first_name}</span>
              </Link>
            ) : (
              <Link href="/donor/register" className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-full hover:bg-brand-dark transition-colors">
                Devenir donneur
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="container mx-auto px-6 pt-16 pb-14 md:pt-24 md:pb-20 text-center">
        <div className="inline-flex items-center gap-1.5 mb-7 px-3.5 py-1.5 text-xs font-medium border border-line rounded-full text-slate bg-surface">
          <span className="w-1.5 h-1.5 rounded-full bg-recovery" />
          {isRTL ? "منصة التبرع بالدم" : "Plateforme de don de sang"}
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.1] text-ink">
          {t.hero.title}<br />
          <span className="text-brand">{t.hero.subtitle}</span>
        </h1>
        <p className="text-base md:text-lg text-slate max-w-lg mx-auto mb-9 leading-relaxed">{t.hero.description}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/donor/register" className="px-7 py-3.5 bg-brand text-white rounded-full font-medium hover:bg-brand-dark transition-colors shadow-soft">
            {t.hero.ctaPrimary}
          </Link>
          <Link href="/explorer" className="px-7 py-3.5 border border-line rounded-full font-medium text-ink hover:border-slate transition-colors bg-surface">
            {t.hero.ctaSecondary}
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-16">
        {activeCampaign && (
          <a href={`/campaigns/${activeCampaign.id}`} className="block max-w-3xl mx-auto mb-10 bg-brand-light rounded-2xl p-5 md:p-6 flex items-center justify-between gap-4 hover:opacity-90 transition-opacity">
            <div>
              <p className="text-xs font-medium text-brand-dark mb-1">Campagne en cours</p>
              <h3 className="font-display font-semibold text-ink">{activeCampaign.name}</h3>
              {activeCampaign.description && <p className="text-sm text-slate mt-1 line-clamp-1">{activeCampaign.description}</p>}
            </div>
            <span className="shrink-0 px-4 py-2 bg-brand text-white text-sm rounded-full font-medium">Découvrir</span>
          </a>
        )}
        <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-3xl mx-auto">
          {[
            { value: loading ? "···" : (donorsCount + requestsCount).toString(), label: t.stats.wilayas },
            { value: loading ? "···" : donorsCount.toString(), label: t.stats.donors },
            { value: loading ? "···" : requestsCount.toString(), label: t.stats.lives },
          ].map((stat, i) => (
            <div key={i} className="text-center p-5 md:p-6 rounded-2xl bg-surface border border-line">
              <div className="font-display text-2xl md:text-4xl font-bold text-ink">{stat.value}</div>
              <div className="text-xs text-slate mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-6 py-16 md:py-20">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-4 tracking-tight text-ink">{t.features.title}</h2>
        <p className="text-center text-slate mb-12 max-w-md mx-auto">Tout ce qu'il faut pour donner, recevoir et sauver des vies, en toute confiance.</p>
        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {t.features.items.map((item, i) => {
            const href = item.icon === "📍" ? "/facilities" : item.icon === "⚡" ? "/requester/register" : "/donor/register";
            const path = FEATURE_ICONS[item.icon] || FEATURE_ICONS["🛡️"];
            return (
              <Link key={i} href={href} className="p-7 rounded-2xl bg-surface border border-line hover:border-brand/30 hover:shadow-soft transition-all block">
                <div className="w-11 h-11 rounded-xl bg-brand-light flex items-center justify-center mb-5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#123E96" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>
                </div>
                <h3 className="font-display text-base font-semibold mb-2 text-ink">{item.title}</h3>
                <p className="text-sm text-slate leading-relaxed">{item.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-line py-8 mb-16 md:mb-0">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <Logo size={18} />
          <div className="text-xs text-slate">{t.footer.tagline}</div>
          <div className="text-xs text-slate/70">{t.footer.rights}</div>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}

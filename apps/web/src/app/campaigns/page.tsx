"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { API_URL } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  start_date: string;
  end_date: string | null;
  hours_label: string | null;
  wilaya_id: number | null;
  location: string | null;
  blood_types_needed: string[] | null;
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [wilayas, setWilayas] = useState<{ id: number; name_fr: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const wilayaName = (id: number | null) => (id ? wilayas.find((w) => w.id === id)?.name_fr : null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/campaigns`).then((r) => r.json()),
      fetch(`${API_URL}/wilayas`).then((r) => r.json()),
    ])
      .then(([c, w]) => {
        setCampaigns(Array.isArray(c) ? c : []);
        setWilayas(Array.isArray(w) ? w : []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ErrorBoundary fallbackTitle="Erreur d'affichage des campagnes">
    <div className="min-h-screen bg-paper text-ink pb-safe-nav">
      <Header />
      <main className="container mx-auto px-5 md:px-6 py-10 max-w-2xl">
        <h1 className="font-display text-2xl font-bold mb-1 text-ink">Campagnes de don</h1>
        <p className="text-slate mb-6 text-sm">Collectes organisées près de chez vous.</p>

        {loading ? (
          <div className="text-center py-12 text-slate text-sm">Chargement...</div>
        ) : campaigns.length === 0 ? (
          <div className="bg-surface p-8 rounded-2xl border border-line text-center">
            <p className="text-slate text-sm">Aucune campagne active pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <Link key={c.id} href={`/campaigns/${c.id}`} className="block bg-surface rounded-2xl border border-line overflow-hidden hover:border-brand/30 transition-colors">
                {c.image_url && (
                  <img src={c.image_url} alt={c.name} className="w-full h-36 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-ink">{c.name}</h3>
                  {c.description && <p className="text-sm text-slate mt-1 line-clamp-2">{c.description}</p>}
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate">
                    <span>{new Date(c.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                    {wilayaName(c.wilaya_id) && <span>· {wilayaName(c.wilaya_id)}</span>}
                    {c.hours_label && <span>· {c.hours_label}</span>}
                  </div>
                  {c.blood_types_needed && c.blood_types_needed.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.blood_types_needed.map((bt) => (
                        <span key={bt} className="text-xs px-2 py-0.5 bg-vital-light text-vital-dark rounded-full font-semibold">{bt}</span>
                      ))}
                    </div>
                  )}
                </div>
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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminNav } from "@/components/AdminNav";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export default function AdminOverviewPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = (user?.roles || []).includes("admin");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    if (!isAdmin) { setLoading(false); return; }
    const token = getToken();
    fetch(`${API_URL}/admin/stats`, { headers: { Authorization: "Bearer " + token } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  if (authLoading || loading) return <div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Chargement...</div>;
  if (!isAdmin) return <div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Accès réservé aux administrateurs.</div>;

  const cards = [
    { label: "Utilisateurs", value: stats?.users_total, href: "/admin/users" },
    { label: "Donneurs", value: stats?.donors_total, href: "/admin/donors" },
    { label: "Demandes totales", value: stats?.requests_total, href: "/admin/requests" },
    { label: "Demandes actives", value: stats?.requests_active, href: "/admin/requests" },
    { label: "Campagnes actives", value: stats?.campaigns_active, href: "/admin/campaigns" },
    { label: "Établissements référencés", value: stats?.facilities_total, href: "/facilities" },
  ];

  return (
    <ErrorBoundary fallbackTitle="Erreur d'affichage de l'administration">
    <div className="min-h-screen bg-paper text-ink">
      <Header />
      <main className="container mx-auto px-5 md:px-6 py-8 max-w-3xl">
        <AdminNav />
        <h1 className="font-display text-2xl font-bold text-ink mb-1">Vue d'ensemble</h1>
        <p className="text-slate text-sm mb-6">Chiffres réels calculés depuis la base de données.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {cards.map((c) => (
            <a key={c.label} href={c.href} className="bg-surface border border-line rounded-2xl p-5 hover:border-brand/30 transition-colors">
              <p className="font-display text-3xl font-bold text-ink">{c.value ?? "···"}</p>
              <p className="text-xs text-slate mt-1">{c.label}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
    </ErrorBoundary>
  );
}

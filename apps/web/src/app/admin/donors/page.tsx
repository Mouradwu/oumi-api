"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import { toArray } from "@/lib/safe";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminNav } from "@/components/AdminNav";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export default function AdminDonorsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [donors, setDonors] = useState<any[]>([]);
  const [wilayas, setWilayas] = useState<{ id: number; name_fr: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = (user?.roles || []).includes("admin");
  const wilayaName = (id: number) => wilayas.find((w) => w.id === id)?.name_fr || `#${id}`;

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    if (!isAdmin) { setLoading(false); return; }
    const token = getToken();
    Promise.all([
      fetch(`${API_URL}/admin/donors`, { headers: { Authorization: "Bearer " + token } }),
      fetch(`${API_URL}/wilayas`),
    ]).then(async ([dRes, wRes]) => {
      if (dRes.ok) setDonors(await dRes.json());
      if (wRes.ok) setWilayas(await wRes.json());
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  if (authLoading || loading) return <div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Chargement...</div>;
  if (!isAdmin) return <div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Accès réservé aux administrateurs.</div>;

  return (
    <ErrorBoundary fallbackTitle="Erreur d'affichage des donneurs">
    <div className="min-h-screen bg-paper text-ink">
      <Header />
      <main className="container mx-auto px-5 md:px-6 py-8 max-w-3xl">
        <AdminNav />
        <h1 className="font-display text-2xl font-bold text-ink mb-4">Donneurs ({donors.length})</h1>
        {donors.length === 0 ? (
          <div className="bg-surface border border-line rounded-2xl p-8 text-center text-slate text-sm">Aucun donneur enregistré.</div>
        ) : (
          <div className="space-y-2">
            {donors.map((d) => (
              <div key={d.id} className="bg-surface border border-line rounded-2xl p-4 flex justify-between items-center gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-ink text-sm">{d.user?.first_name} {d.user?.last_name || ""}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-vital-light text-vital-dark rounded-full font-semibold">{d.blood_type}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${d.availability_status === "green" ? "bg-recovery-light text-recovery-dark" : "bg-mist text-slate"}`}>
                      {d.availability_status === "green" ? "Disponible" : "Indisponible"}
                    </span>
                    {d.certified && <span className="text-[10px] px-2 py-0.5 bg-brand-light text-brand-dark rounded-full font-medium">Certifié</span>}
                  </div>
                  <p className="text-xs text-slate mt-1">
                    {d.user?.email} {d.user?.phone && `· ${d.user.phone}`} · {wilayaName(d.wilaya_id)} · {toArray(d.donation_types).join(", ")} · {d.donation_count || 0} don(s) confirmé(s)
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
    </ErrorBoundary>
  );
}

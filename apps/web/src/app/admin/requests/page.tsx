"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminNav } from "@/components/AdminNav";

const STATUS_LABEL: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-amber-light text-amber", label: "En attente" },
  accepted: { color: "bg-brand-light text-brand-dark", label: "Acceptée" },
  donation_declared: { color: "bg-brand-light text-brand-dark", label: "Don déclaré" },
  confirmed: { color: "bg-recovery-light text-recovery-dark", label: "Confirmée" },
  cancelled: { color: "bg-mist text-slate", label: "Annulée" },
  refused: { color: "bg-vital-light text-vital-dark", label: "Refusée" },
};

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export default function AdminRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [wilayas, setWilayas] = useState<{ id: number; name_fr: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isAdmin = (user?.roles || []).includes("admin");
  const wilayaName = (id: number) => wilayas.find((w) => w.id === id)?.name_fr || `#${id}`;

  const load = async () => {
    const token = getToken();
    const [rRes, wRes] = await Promise.all([
      fetch(`${API_URL}/admin/requests`, { headers: { Authorization: "Bearer " + token } }),
      fetch(`${API_URL}/wilayas`),
    ]);
    if (rRes.ok) setRequests(await rRes.json());
    if (wRes.ok) setWilayas(await wRes.json());
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    if (!isAdmin) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const deleteRequest = async (id: string) => {
    if (!confirm("Supprimer définitivement cette demande ?")) return;
    setBusyId(id);
    const token = getToken();
    await fetch(`${API_URL}/admin/requests/${id}`, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setBusyId(null);
  };

  if (authLoading || loading) return <div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Chargement...</div>;
  if (!isAdmin) return <div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Accès réservé aux administrateurs.</div>;

  return (
    <ErrorBoundary fallbackTitle="Erreur d'affichage des demandes">
    <div className="min-h-screen bg-paper text-ink">
      <Header />
      <main className="container mx-auto px-5 md:px-6 py-8 max-w-3xl">
        <AdminNav />
        <h1 className="font-display text-2xl font-bold text-ink mb-4">Demandes ({requests.length})</h1>
        {requests.length === 0 ? (
          <div className="bg-surface border border-line rounded-2xl p-8 text-center text-slate text-sm">Aucune demande enregistrée.</div>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => {
              const status = STATUS_LABEL[r.status] || STATUS_LABEL.pending;
              return (
                <div key={r.id} className="bg-surface border border-line rounded-2xl p-4 flex justify-between items-center gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-ink text-sm">{r.blood_type} · {r.donation_type}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.color}`}>{status.label}</span>
                    </div>
                    <p className="text-xs text-slate mt-1">
                      {r.requester?.first_name} {r.requester?.email && `(${r.requester.email})`} · {r.hospital_name || "établissement non précisé"} · {wilayaName(r.wilaya_id)} · {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <button onClick={() => deleteRequest(r.id)} disabled={busyId === r.id} className="text-xs px-3 py-1.5 text-vital hover:bg-vital-light rounded-full transition-colors disabled:opacity-50">
                    Supprimer
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
    </ErrorBoundary>
  );
}

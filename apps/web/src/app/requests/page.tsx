"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import { API_URL } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface Request {
  id: string;
  blood_type: string;
  donation_type: string;
  wilaya_id: number;
  hospital_name: string | null;
  urgency_level: string;
  status: string;
  created_at: string;
  response_count: number;
}

const ACTIVE_STATUSES = ["pending", "matched"];
const COMPLETED_STATUSES = ["fulfilled", "cancelled"];

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export default function RequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [wilayas, setWilayas] = useState<{ id: number; code: string; name_fr: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "completed" | "all">("active");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const wilayaName = (id: number) => wilayas.find((w) => w.id === id)?.name_fr || `#${id}`;

  const load = async () => {
    if (!user) return;
    const token = getToken();
    try {
      const [reqRes, wilayaRes] = await Promise.all([
        fetch(`${API_URL}/requests?userId=${user.id}`, { headers: { Authorization: "Bearer " + token } }),
        fetch(`${API_URL}/wilayas`),
      ]);
      const reqData = await reqRes.json();
      const wilayaData = await wilayaRes.json();
      setRequests(Array.isArray(reqData) ? reqData : []);
      setWilayas(Array.isArray(wilayaData) ? wilayaData : []);
    } catch {
      // laisse l'etat precedent en cas d'echec ponctuel
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const deleteRequest = async (id: string) => {
    if (!confirm("Supprimer définitivement cette demande de votre historique ?")) return;
    setDeletingId(id);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/requests/${id}`, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
      if (!res.ok) throw new Error();
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-yellow-600/20 text-yellow-400", label: "⏳ En attente" },
      matched: { color: "bg-blue-600/20 text-blue-400", label: "🔵 Donneur trouvé" },
      fulfilled: { color: "bg-green-600/20 text-green-400", label: "✅ Vie sauvée" },
      cancelled: { color: "bg-gray-600/20 text-gray-400", label: "✖️ Annulée" },
    };
    return map[status] || map.pending;
  };

  const filtered = requests.filter((r) => {
    if (tab === "active") return ACTIVE_STATUSES.includes(r.status);
    if (tab === "completed") return COMPLETED_STATUSES.includes(r.status);
    return true; // "all" = historique complet
  });

  const activeCount = requests.filter((r) => ACTIVE_STATUSES.includes(r.status)).length;
  const completedCount = requests.filter((r) => COMPLETED_STATUSES.includes(r.status)).length;

  if (authLoading || loading) {
    return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">Chargement...</div>;
  }

  return (
    <ErrorBoundary fallbackTitle="Erreur d'affichage de vos demandes">
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Header />
      <main className="container mx-auto px-6 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">📋 Mes demandes</h1>
        <p className="text-white/50 mb-6 text-sm">Historique de vos demandes de don, avec leur statut et les réponses reçues.</p>

        <div className="flex gap-2 mb-6 border-b border-white/10">
          <button onClick={() => setTab("active")} className={`px-4 py-2 text-sm border-b-2 transition ${tab === "active" ? "border-red-500 text-white" : "border-transparent text-white/50 hover:text-white"}`}>
            Actives {activeCount > 0 && `(${activeCount})`}
          </button>
          <button onClick={() => setTab("completed")} className={`px-4 py-2 text-sm border-b-2 transition ${tab === "completed" ? "border-red-500 text-white" : "border-transparent text-white/50 hover:text-white"}`}>
            Terminées {completedCount > 0 && `(${completedCount})`}
          </button>
          <button onClick={() => setTab("all")} className={`px-4 py-2 text-sm border-b-2 transition ${tab === "all" ? "border-red-500 text-white" : "border-transparent text-white/50 hover:text-white"}`}>
            Historique complet ({requests.length})
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white/5 p-8 rounded-xl text-center">
            <p className="text-white/50">
              {tab === "active" ? "Aucune demande active." : tab === "completed" ? "Aucune demande terminée." : "Aucune demande pour le moment."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((req) => {
              const status = getStatusBadge(req.status);
              return (
                <div key={req.id} className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h3 className="font-semibold">🩸 {req.blood_type} · {req.donation_type}</h3>
                      <p className="text-sm text-white/60">🏥 {req.hospital_name || "Établissement non précisé"}</p>
                      <p className="text-sm text-white/40">📍 {wilayaName(req.wilaya_id)} · {new Date(req.created_at).toLocaleDateString("fr-FR")}</p>
                      {req.response_count > 0 && (
                        <p className="text-sm text-green-400 mt-1">
                          💬 {req.response_count} réponse{req.response_count > 1 ? "s" : ""} reçue{req.response_count > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${status.color}`}>{status.label}</span>
                      <button
                        onClick={() => deleteRequest(req.id)}
                        disabled={deletingId === req.id}
                        className="text-xs text-white/30 hover:text-red-400 transition disabled:opacity-50"
                      >
                        {deletingId === req.id ? "..." : "🗑️ Supprimer"}
                      </button>
                    </div>
                  </div>
                  {ACTIVE_STATUSES.includes(req.status) && (
                    <div className="mt-3">
                      <a href="/matching" className="px-3 py-1 bg-red-600/20 text-red-400 text-sm rounded hover:bg-red-600/30 transition inline-block">
                        🤝 Trouver un donneur
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <a href="/requester/register" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition">
            📢 Créer une nouvelle demande
          </a>
        </div>
      </main>
    </div>
    </ErrorBoundary>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
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
  donor_id: string | null;
  created_at: string;
  response_count: number;
}

// pending -> accepted -> donation_declared -> confirmed (ou refused / cancelled)
const ACTIVE_STATUSES = ["pending", "accepted", "donation_declared"];
const COMPLETED_STATUSES = ["confirmed", "cancelled", "refused"];

const STATUS_LABELS: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-amber-light text-amber", label: "En attente" },
  accepted: { color: "bg-brand-light text-brand-dark", label: "Donneur trouvé" },
  donation_declared: { color: "bg-brand-light text-brand-dark", label: "Don déclaré — à confirmer" },
  confirmed: { color: "bg-recovery-light text-recovery-dark", label: "Don confirmé" },
  cancelled: { color: "bg-mist text-slate", label: "Annulée" },
  refused: { color: "bg-vital-light text-vital-dark", label: "Refusée" },
};

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
  const [busyId, setBusyId] = useState<string | null>(null);

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
    setBusyId(id);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/requests/${id}`, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
      if (!res.ok) throw new Error();
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("Erreur lors de la suppression");
    } finally {
      setBusyId(null);
    }
  };

  // Le demandeur confirme que le don a bien eu lieu - seule action qui fait
  // progresser l'impact et les badges du donneur cote serveur.
  const confirmDonation = async (id: string) => {
    if (!confirm("Confirmer que ce don a bien été effectué ? Cette action met à jour l'impact du donneur.")) return;
    setBusyId(id);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/requests/${id}/confirm-donation`, { method: "POST", headers: { Authorization: "Bearer " + token } });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      alert("Erreur lors de la confirmation");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = requests.filter((r) => {
    if (tab === "active") return ACTIVE_STATUSES.includes(r.status);
    if (tab === "completed") return COMPLETED_STATUSES.includes(r.status);
    return true;
  });

  const activeCount = requests.filter((r) => ACTIVE_STATUSES.includes(r.status)).length;
  const completedCount = requests.filter((r) => COMPLETED_STATUSES.includes(r.status)).length;

  if (authLoading || loading) {
    return <div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Chargement...</div>;
  }

  return (
    <ErrorBoundary fallbackTitle="Erreur d'affichage de vos demandes">
    <div className="min-h-screen bg-paper text-ink pb-safe-nav">
      <Header />
      <main className="container mx-auto px-5 md:px-6 py-10 max-w-2xl">
        <h1 className="font-display text-2xl font-bold mb-1 text-ink">Mes demandes</h1>
        <p className="text-slate mb-6 text-sm">Historique de vos demandes, avec leur statut et les réponses reçues.</p>

        <div className="flex gap-1 mb-6 border-b border-line">
          <button onClick={() => setTab("active")} className={`px-4 py-2.5 text-sm border-b-2 transition-colors font-medium ${tab === "active" ? "border-vital text-ink" : "border-transparent text-slate hover:text-ink"}`}>
            Actives {activeCount > 0 && `(${activeCount})`}
          </button>
          <button onClick={() => setTab("completed")} className={`px-4 py-2.5 text-sm border-b-2 transition-colors font-medium ${tab === "completed" ? "border-vital text-ink" : "border-transparent text-slate hover:text-ink"}`}>
            Terminées {completedCount > 0 && `(${completedCount})`}
          </button>
          <button onClick={() => setTab("all")} className={`px-4 py-2.5 text-sm border-b-2 transition-colors font-medium ${tab === "all" ? "border-vital text-ink" : "border-transparent text-slate hover:text-ink"}`}>
            Historique ({requests.length})
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-line text-center">
            <p className="text-slate text-sm">
              {tab === "active" ? "Aucune demande active." : tab === "completed" ? "Aucune demande terminée." : "Aucune demande pour le moment."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => {
              const status = STATUS_LABELS[req.status] || STATUS_LABELS.pending;
              const canConfirm = req.status === "donation_declared";
              return (
                <div key={req.id} className="bg-white p-4 rounded-2xl border border-line">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h3 className="font-semibold text-ink text-sm">{req.blood_type} · {req.donation_type}</h3>
                      <p className="text-sm text-slate mt-0.5">{req.hospital_name || "Établissement non précisé"}</p>
                      <p className="text-xs text-slate mt-0.5">{wilayaName(req.wilaya_id)} · {new Date(req.created_at).toLocaleDateString("fr-FR")}</p>
                      {req.response_count > 0 && (
                        <p className="text-xs text-brand-dark font-medium mt-1.5">
                          {req.response_count} réponse{req.response_count > 1 ? "s" : ""} reçue{req.response_count > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>{status.label}</span>
                      <button
                        onClick={() => deleteRequest(req.id)}
                        disabled={busyId === req.id}
                        className="text-xs text-slate hover:text-vital transition-colors disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {canConfirm && (
                    <div className="mt-3 pt-3 border-t border-line">
                      <p className="text-xs text-slate mb-2">Le donneur a indiqué avoir effectué ce don. Confirmez-vous l'avoir reçu ?</p>
                      <button
                        onClick={() => confirmDonation(req.id)}
                        disabled={busyId === req.id}
                        className="px-4 py-2 bg-brand text-white text-sm rounded-full font-medium hover:bg-brand-dark transition-colors disabled:opacity-50"
                      >
                        {busyId === req.id ? "..." : "Confirmer le don"}
                      </button>
                    </div>
                  )}
                  {req.status === "pending" && (
                    <div className="mt-3 pt-3 border-t border-line">
                      <a href="/matching" className="px-3 py-1.5 bg-vital-light text-vital-dark text-sm rounded-full font-medium hover:bg-vital-light/70 transition-colors inline-block">
                        Trouver un donneur
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <a href="/requester/register" className="inline-block bg-vital hover:bg-vital-dark text-white font-medium py-3 px-6 rounded-full transition-colors">
            Créer une nouvelle demande
          </a>
        </div>
      </main>
      <BottomNav />
    </div>
    </ErrorBoundary>
  );
}

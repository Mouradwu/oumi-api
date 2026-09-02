"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { API_URL } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || localStorage.getItem("access_token") || localStorage.getItem("jwt") || null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Record<string, any>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [pendingAccept, setPendingAccept] = useState<string | null>(null);

  const load = async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const confirmAccept = async () => {
    if (!pendingAccept) return;
    const id = pendingAccept;
    setPendingAccept(null);
    setBusy(id); setError("");
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/notifications/${id}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setContacts((p) => ({ ...p, [id]: data }));
        await load();
      } else {
        setError(data?.message || "Erreur lors de l'acceptation");
      }
    } catch { setError("Erreur réseau"); }
    setBusy("");
  };

  const markRead = async (id: string) => {
    const token = getToken();
    await fetch(`${API_URL}/notifications/${id}/read`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const deleteOne = async (id: string) => {
    const token = getToken();
    await fetch(`${API_URL}/notifications/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = async () => {
    if (!confirm("Supprimer tout l'historique des notifications ? Cette action est irréversible.")) return;
    const token = getToken();
    await fetch(`${API_URL}/notifications/all`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setNotifications([]);
  };

  return (
    <ErrorBoundary fallbackTitle="Erreur d'affichage des notifications">
    <div className="min-h-screen bg-paper text-ink pb-safe-nav">
      <Header />
      <main className="container mx-auto px-5 md:px-6 py-8 max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-display text-2xl font-bold text-ink">Notifications</h1>
          {notifications.length > 0 && (
            <button onClick={clearAll} className="text-xs text-slate hover:text-vital transition-colors">Tout supprimer</button>
          )}
        </div>
        {error && <div className="mb-4 p-4 rounded-xl bg-vital-light text-vital-dark text-sm">{error}</div>}

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-mist rounded-2xl animate-pulse" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 text-slate text-sm">Aucune notification pour le moment.</div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const contact = contacts[n.id]?.contact || n.data?.contact;
              const request = contacts[n.id]?.request || n.data?.request;
              return (
                <div key={n.id} className={`p-5 rounded-2xl border ${n.is_read ? "border-line bg-surface" : "border-vital/30 bg-vital-light"}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="font-semibold text-ink text-sm">{n.title}</div>
                      <div className="text-sm text-slate mt-1">{n.message || n.body}</div>
                      {request && (
                        <div className="text-xs text-slate mt-2 space-x-3">
                          {request.blood_type && <span>Groupe : {request.blood_type}</span>}
                          {request.donation_type && <span>Type : {request.donation_type}</span>}
                          {request.hospital_name && <span>Hôpital : {request.hospital_name}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-xs text-slate">{new Date(n.created_at).toLocaleDateString("fr-FR")}</span>
                      <button onClick={() => deleteOne(n.id)} className="text-slate hover:text-vital text-xs transition-colors" title="Supprimer">✕</button>
                    </div>
                  </div>

                  {contact && (contact.name || contact.phone) && (
                    <div className="mt-4 p-4 rounded-xl bg-recovery-light">
                      <div className="text-sm font-semibold text-recovery-dark mb-1">Coordonnées de contact</div>
                      {contact.name && <div className="text-sm text-ink">{contact.name}</div>}
                      {contact.phone && <a href={`tel:${contact.phone}`} className="text-sm text-recovery-dark underline">{contact.phone}</a>}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    {n.type === "request" && !n.data?.accepted && (
                      <button onClick={() => setPendingAccept(n.id)} disabled={busy === n.id}
                        className="px-4 py-2 bg-vital text-white text-sm rounded-full font-medium hover:bg-vital-dark transition-colors disabled:opacity-50">
                        {busy === n.id ? "..." : "Accepter d'aider"}
                      </button>
                    )}
                    {!n.is_read && (
                      <button onClick={() => markRead(n.id)} className="px-4 py-2 border border-line text-ink text-sm rounded-full hover:bg-mist transition-colors">
                        Marquer comme lu
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />

      {/* Modale de consentement bloquante - obligatoire avant toute acceptation */}
      {pendingAccept && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-surface border border-line rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4 text-ink">Confirmation requise</h2>
            <p className="text-sm text-slate leading-relaxed mb-6">
              En acceptant cette demande, vous autorisez le demandeur à accéder à l'ensemble de vos coordonnées (téléphone et adresse).
            </p>
            <div className="flex gap-3">
              <button onClick={() => setPendingAccept(null)} className="flex-1 px-4 py-2.5 border border-line text-ink rounded-full text-sm hover:bg-mist transition-colors">
                Annuler
              </button>
              <button onClick={confirmAccept} className="flex-1 px-4 py-2.5 bg-brand text-white rounded-full text-sm font-medium hover:bg-brand-dark transition-colors">
                J'accepte et je partage mes coordonnées
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}

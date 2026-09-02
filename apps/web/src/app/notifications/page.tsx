"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { API_URL } from "@/lib/api";

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
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-white/5 backdrop-blur-xl bg-black/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/"><Logo size={28} /></Link>
          <nav className="flex items-center gap-6">
            <Link href="/requests" className="text-sm text-white/70 hover:text-white">Demandes</Link>
            <Link href="/profile" className="text-sm text-white/70 hover:text-white">Profil</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-3xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Notifications</h1>
          {notifications.length > 0 && (
            <button onClick={clearAll} className="text-xs text-white/40 hover:text-red-400 transition">
              🗑️ Tout supprimer
            </button>
          )}
        </div>
        {error && <div className="mb-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm">{error}</div>}

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 text-white/40">Aucune notification pour le moment.</div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => {
              const contact = contacts[n.id]?.contact || n.data?.contact;
              const request = contacts[n.id]?.request || n.data?.request;
              return (
                <div key={n.id} className={`p-6 rounded-2xl border ${n.is_read ? "border-white/5 bg-white/[0.02]" : "border-red-500/30 bg-red-500/5"}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="font-semibold">{n.title}</div>
                      <div className="text-sm text-white/60 mt-1">{n.message || n.body}</div>
                      {request && (
                        <div className="text-xs text-white/40 mt-2">
                          {request.blood_type && <span className="mr-3">Groupe : {request.blood_type}</span>}
                          {request.donation_type && <span className="mr-3">Type : {request.donation_type}</span>}
                          {request.hospital_name && <span>Hôpital : {request.hospital_name}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-xs text-white/40">{new Date(n.created_at).toLocaleDateString("fr-FR")}</span>
                      <button onClick={() => deleteOne(n.id)} className="text-white/30 hover:text-red-400 text-xs transition" title="Supprimer">
                        ✕
                      </button>
                    </div>
                  </div>

                  {contact && (contact.name || contact.phone) && (
                    <div className="mt-4 p-4 rounded-xl border border-green-500/30 bg-green-500/10">
                      <div className="text-sm font-semibold text-green-400 mb-1">Coordonnées de contact</div>
                      {contact.name && <div className="text-sm">{contact.name}</div>}
                      {contact.phone && <a href={`tel:${contact.phone}`} className="text-sm text-green-300 underline">{contact.phone}</a>}
                    </div>
                  )}

                  <div className="mt-4 flex gap-3">
                    {n.type === "request" && !n.data?.accepted && (
                      <button onClick={() => setPendingAccept(n.id)} disabled={busy === n.id}
                        className="px-4 py-2 bg-white text-black text-sm rounded-full font-medium hover:bg-white/90 disabled:opacity-50">
                        {busy === n.id ? "..." : "Accepter d'aider"}
                      </button>
                    )}
                    {!n.is_read && (
                      <button onClick={() => markRead(n.id)} className="px-4 py-2 border border-white/10 text-sm rounded-full hover:bg-white/5">
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

      {/* Modale de consentement bloquante - obligatoire avant toute acceptation */}
      {pendingAccept && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-[#141419] border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">⚠️ Confirmation requise</h2>
            <p className="text-sm text-white/70 leading-relaxed mb-6">
              En acceptant cette demande, vous autorisez le demandeur à accéder à l'ensemble de vos coordonnées (téléphone et adresse).
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingAccept(null)}
                className="flex-1 px-4 py-2 border border-white/10 rounded-full text-sm hover:bg-white/5 transition"
              >
                Annuler
              </button>
              <button
                onClick={confirmAccept}
                className="flex-1 px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 transition"
              >
                J'accepte et je partage mes coordonnées
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

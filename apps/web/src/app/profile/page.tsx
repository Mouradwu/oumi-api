"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  data: any;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    const token = localStorage.getItem("token");
    // Récupérer les notifications de l'utilisateur
    fetch(`https://oumiapi-production.up.railway.app/notifications?userId=${user.id}`, {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur");
        return res.json();
      })
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setNotifications([]);
        setLoading(false);
      });
  }, [user, router]);

  // Séparer les notifications par type
  const requestsReceived = notifications.filter(n => n.type === "request" && !n.read); // reçues (donneur)
  const requestsSent = notifications.filter(n => n.type === "request" && n.read); // envoyées et lues (receveur)
  const accepted = notifications.filter(n => n.type === "acceptance"); // acceptées (les deux)

  const handleAccept = async (notifId: number) => {
    setProcessing(notifId);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`https://oumiapi-production.up.railway.app/notifications/${notifId}/accept`, {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error("Erreur lors de l'acceptation");
      // Mettre à jour la notification localement
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notifId ? { ...n, read: true, title: "✅ Acceptée", message: "Vous avez accepté cette demande. Le receveur a reçu vos coordonnées." } : n
        )
      );
    } catch (err) {
      console.error("Erreur", err);
      alert("Erreur lors de l'acceptation.");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">Chargement...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-white/5 backdrop-blur-xl bg-black/20 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/"><Logo size={28} /></Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm text-white/70 hover:text-white">Accueil</Link>
            <Link href="/explorer" className="text-sm text-white/70 hover:text-white">Explorer</Link>
            <Link href="/profile" className="text-sm text-white/70 hover:text-white font-semibold text-red-400">Profil</Link>
            <Link href="/notifications" className="text-sm text-white/70 hover:text-white">🔔</Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/60">Bonjour {user.first_name}</span>
            <button onClick={logout} className="text-sm text-red-400 hover:text-red-300 transition">Déconnexion</button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">👤 Mon profil</h1>

        {/* Informations personnelles */}
        <div className="bg-white/5 p-6 rounded-xl border border-white/10 mb-8">
          <h2 className="text-xl font-semibold mb-4">Informations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><span className="text-white/40 text-sm">Prénom</span><p className="text-lg">{user.first_name}</p></div>
            <div><span className="text-white/40 text-sm">Nom</span><p className="text-lg">{user.last_name}</p></div>
            <div><span className="text-white/40 text-sm">Email</span><p className="text-lg">{user.email}</p></div>
            <div><span className="text-white/40 text-sm">Téléphone</span><p className="text-lg">{user.phone || "Non renseigné"}</p></div>
          </div>
        </div>

        {/* Demandes reçues (pour donneur) */}
        {requestsReceived.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">🩸 Demandes d'aide reçues</h2>
            <div className="space-y-4">
              {requestsReceived.map((notif) => (
                <div key={notif.id} className="bg-white/5 p-4 rounded-xl border border-red-500/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white/70">{notif.message}</p>
                      <p className="text-xs text-white/40 mt-1">Reçu le {new Date(notif.created_at).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => handleAccept(notif.id)}
                      disabled={processing === notif.id}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition disabled:opacity-50"
                    >
                      {processing === notif.id ? "..." : "🤝 Accepter"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demandes que vous avez envoyées (pour receveur) */}
        {requestsSent.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">📤 Demandes que vous avez envoyées</h2>
            <div className="space-y-4">
              {requestsSent.map((notif) => (
                <div key={notif.id} className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-white/70">{notif.message}</p>
                  <p className="text-xs text-white/40 mt-1">Envoyée le {new Date(notif.created_at).toLocaleDateString()}</p>
                  <span className="text-yellow-400 text-sm mt-1 inline-block">⏳ En attente de réponse</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demandes acceptées (contact) */}
        {accepted.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">✅ Demandes acceptées</h2>
            <div className="space-y-4">
              {accepted.map((notif) => (
                <div key={notif.id} className="bg-white/5 p-4 rounded-xl border border-green-500/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white/70">{notif.message}</p>
                      <p className="text-xs text-white/40 mt-1">Acceptée le {new Date(notif.created_at).toLocaleDateString()}</p>
                      {notif.data?.donorPhone && (
                        <p className="text-sm text-green-400 mt-2">📞 {notif.data.donorPhone}</p>
                      )}
                      {notif.data?.recipientPhone && (
                        <p className="text-sm text-green-400 mt-2">📞 {notif.data.recipientPhone}</p>
                      )}
                    </div>
                    <span className="text-green-400 text-sm">✓</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {requestsReceived.length === 0 && requestsSent.length === 0 && accepted.length === 0 && (
          <div className="text-center py-12 text-white/50">Aucune activité récente.</div>
        )}
      </main>
    </div>
  );
}

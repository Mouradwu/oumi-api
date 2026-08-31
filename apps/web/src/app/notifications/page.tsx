"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  data: any;
  created_at: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    // Récupérer les notifications de l'utilisateur connecté
    fetch("https://oumiapi-production.up.railway.app/notifications?userId=me", {
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
  }, [router]);

  const handleAccept = async (notifId: number) => {
    setProcessing(notifId);
    const token = localStorage.getItem("token");
    try {
      // Marquer la notification comme lue et accepter la demande
      await fetch(`https://oumiapi-production.up.railway.app/notifications/${notifId}/accept`, {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      // Mettre à jour la liste (on peut recharger)
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notifId ? { ...n, read: true, title: "✅ Acceptée", message: "Vous avez accepté cette demande. Le receveur peut désormais voir vos coordonnées." } : n
        )
      );
    } catch (err) {
      console.error("Erreur lors de l'acceptation", err);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-white/60 hover:text-white transition">&larr; Retour</Link>
        <h1 className="text-3xl font-bold mt-6">🔔 Mes notifications</h1>
        {notifications.length === 0 ? (
          <p className="text-white/50 mt-8">Aucune notification</p>
        ) : (
          <div className="space-y-4 mt-6">
            {notifications.map((notif) => (
              <div key={notif.id} className={`bg-white/5 p-4 rounded-xl border ${notif.read ? 'border-white/10' : 'border-red-500/30'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{notif.title}</h3>
                    <p className="text-white/70 text-sm">{notif.message}</p>
                    {notif.data?.donorId && (
                      <p className="text-xs text-white/40 mt-1">Demande de : {notif.data.receiverName || "Un receveur"}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-white/30">
                    {new Date(notif.created_at).toLocaleDateString()}
                  </div>
                </div>
                {notif.type === "request" && !notif.read && (
                  <button
                    onClick={() => handleAccept(notif.id)}
                    disabled={processing === notif.id}
                    className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition disabled:opacity-50"
                  >
                    {processing === notif.id ? "En cours..." : "🤝 Accepter la demande"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


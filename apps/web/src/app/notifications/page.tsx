"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useNotifications } from "@/context/NotificationContext";

export default function NotificationsPage() {
  const { notifications, loading, fetchNotifications, markAsRead } = useNotifications();
  const [processing, setProcessing] = useState<number | null>(null);

  const handleAccept = async (id: number) => {
    setProcessing(id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://oumiapi-production.up.railway.app/notifications/${id}/accept`, {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error("Erreur");
      await fetchNotifications(); // refresh
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0f] text-white"><Header /><div className="container mx-auto p-6">Chargement...</div></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Header />
      <main className="container mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🔔 Notifications</h1>
          <button onClick={fetchNotifications} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition">🔄 Rafraîchir</button>
        </div>
        {notifications.length === 0 ? (
          <p className="text-white/50">Aucune notification</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div key={notif.id} className={`bg-white/5 p-4 rounded-xl border ${notif.read ? 'border-white/10' : 'border-red-500/30'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{notif.title}</h3>
                    <p className="text-white/70 text-sm">{notif.message}</p>
                    {notif.data?.receiverName && (
                      <p className="text-xs text-white/40 mt-1">De : {notif.data.receiverName}</p>
                    )}
                    {notif.type === 'acceptance' && notif.data?.donorPhone && (
                      <p className="text-green-400 text-sm mt-2">📞 {notif.data.donorPhone}</p>
                    )}
                    <p className="text-xs text-white/30 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    {!notif.read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        disabled={processing === notif.id}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition disabled:opacity-50"
                      >
                        {processing === notif.id ? "..." : "Marquer lu"}
                      </button>
                    )}
                    {notif.type === 'request' && !notif.read && (
                      <button
                        onClick={() => handleAccept(notif.id)}
                        disabled={processing === notif.id}
                        className="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition"
                      >
                        ✅ Accepter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

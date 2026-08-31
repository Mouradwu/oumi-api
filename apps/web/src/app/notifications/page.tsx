"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useNotifications } from "@/context/NotificationContext";

export default function NotificationsPage() {
  const { notifications, loading, markAsRead } = useNotifications();
  const [processing, setProcessing] = useState<number | null>(null);

  const handleMarkAsRead = async (id: number) => {
    setProcessing(id);
    await markAsRead(id);
    setProcessing(null);
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0f] text-white"><Header /><div className="container mx-auto p-6">Chargement...</div></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Header />
      <main className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">🔔 Mes notifications</h1>
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
                    <p className="text-xs text-white/30 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                  </div>
                  {!notif.read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      disabled={processing === notif.id}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition disabled:opacity-50"
                    >
                      {processing === notif.id ? "..." : "Marquer comme lu"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

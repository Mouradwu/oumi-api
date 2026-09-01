"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { API_URL } from "@/lib/api";

interface Request {
  id: string;
  blood_type: string;
  donation_type: string;
  wilaya_id: number;
  hospital_name: string | null;
  urgency_level: string;
  status: string;
  created_at: string;
}

export default function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [wilayas, setWilayas] = useState<{ id: number; code: string; name_fr: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const wilayaName = (id: number) => wilayas.find((w) => w.id === id)?.name_fr || `#${id}`;

  useEffect(() => {
    const token = localStorage.getItem("token");
    Promise.all([
      fetch(`${API_URL}/requests`, { headers: { Authorization: "Bearer " + token } }).then((r) => r.json()),
      fetch(`${API_URL}/wilayas`).then((r) => r.json()),
    ])
      .then(([reqData, wilayaData]) => {
        setRequests(Array.isArray(reqData) ? reqData : []);
        setWilayas(Array.isArray(wilayaData) ? wilayaData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-yellow-600/20 text-yellow-400", label: "⏳ En attente" },
      matched: { color: "bg-blue-600/20 text-blue-400", label: "🔵 Donneur trouvé" },
      fulfilled: { color: "bg-green-600/20 text-green-400", label: "✅ Vie sauvée" },
      cancelled: { color: "bg-gray-600/20 text-gray-400", label: "✖️ Annulée" },
    };
    return map[status] || map.pending;
  };

  const filteredRequests = filter === "all" ? requests : requests.filter(r => r.status === filter);

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-white/60 hover:text-white transition">&larr; Retour</Link>
        <h1 className="text-3xl font-bold mt-6">📋 Demandes de sang</h1>

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full text-sm transition ${
              filter === "all" ? "bg-red-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-full text-sm transition ${
              filter === "pending" ? "bg-yellow-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            ⏳ En attente
          </button>
          <button
            onClick={() => setFilter("matched")}
            className={`px-4 py-2 rounded-full text-sm transition ${
              filter === "matched" ? "bg-blue-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            🔵 Donneur trouvé
          </button>
          <button
            onClick={() => setFilter("fulfilled")}
            className={`px-4 py-2 rounded-full text-sm transition ${
              filter === "fulfilled" ? "bg-green-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            ✅ Sauvées
          </button>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="bg-white/5 p-8 rounded-xl text-center mt-6">
            <p className="text-white/50">Aucune demande trouvée</p>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {filteredRequests.map((req) => {
              const status = getStatusBadge(req.status);
              return (
                <div key={req.id} className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">
                        🩸 {req.blood_type} - {req.donation_type}
                      </h3>
                      <p className="text-sm text-white/60">🏥 {req.hospital_name || "Établissement non précisé"}</p>
                      <p className="text-sm text-white/40">📍 {wilayaName(req.wilaya_id)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm px-2 py-1 rounded ${status.color}`}>
                        {status.label}
                      </span>
                      <p className="text-xs text-white/30 mt-1">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link href="/matching" className="px-3 py-1 bg-red-600/20 text-red-400 text-sm rounded hover:bg-red-600/30 transition">
                      🤝 Trouver un donneur
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <Link href="/request/create" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition">
            📢 Créer une demande
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { API_URL } from "@/lib/api";

interface Match {
  id: string;
  donor: {
    id: string;
    blood_type: string;
    donation_types: string[];
    wilaya_id: number;
    distance: number;
    availability_status: string;
    certified: boolean;
    has_donated_before: boolean;
    last_donation_date: string | null;
    user: { first_name: string; last_name: string };
  };
  score: number;
  compatibility: string;
}

export default function MatchingPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [wilayas, setWilayas] = useState<{ id: number; code: string; name_fr: string }[]>([]);
  const [selectedRequest, setSelectedRequest] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "matches">("list");

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
        setLoadingRequests(false);
      })
      .catch(() => setLoadingRequests(false));
  }, []);

  const handleFindMatches = async () => {
    if (!selectedRequest) return;
    setLoading(true);
    setError("");
    setMatches([]);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/matching/find/${selectedRequest}`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur de matching");
      setMatches(data);
      setViewMode("matches");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingRequests) {
    return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">Chargement des demandes...</div>;
  }

  const urgencyStyle = (level: string) => {
    if (level === 'critical') return 'bg-red-600 text-white';
    if (level === 'urgent') return 'bg-orange-600 text-white';
    if (level === 'important') return 'bg-yellow-600 text-white';
    return 'bg-green-600 text-white';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-white/60 hover:text-white transition">&larr; Retour</Link>
        <h1 className="text-3xl font-bold mt-6">🤝 Matching automatique</h1>
        <p className="text-white/50 mt-2">Trouvez des donneurs compatibles en quelques secondes</p>

        {viewMode === "list" ? (
          <>
            <div className="mt-6 space-y-4">
              <h2 className="text-xl font-semibold">Demandes en cours</h2>

              {requests.length === 0 ? (
                <div className="bg-yellow-500/20 text-yellow-400 p-4 rounded-lg">
                  Aucune demande active. Créez-en une !
                </div>
              ) : (
                requests.map((req: any) => (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req.id)}
                    className={`p-4 border rounded-xl cursor-pointer transition ${
                      selectedRequest === req.id
                        ? "border-red-500 bg-red-500/10"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">🩸 {req.blood_type} - {req.donation_type}</h3>
                        <p className="text-sm text-white/60">🏥 {req.hospital_name || "Établissement non précisé"}</p>
                        <p className="text-sm text-white/40">📍 {wilayaName(req.wilaya_id)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm px-2 py-1 rounded ${urgencyStyle(req.urgency_level)}`}>
                          {req.urgency_level}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {requests.length > 0 && (
              <button
                onClick={handleFindMatches}
                disabled={!selectedRequest || loading}
                className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Recherche en cours..." : "🔍 Trouver des donneurs compatibles"}
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => setViewMode("list")}
              className="mt-4 text-sm text-white/60 hover:text-white transition"
            >
              ← Retour à la liste des demandes
            </button>

            {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mt-4">{error}</div>}

            {matches.length === 0 ? (
              <div className="bg-yellow-500/20 text-yellow-400 p-6 rounded-lg mt-6">
                <p className="font-semibold">😔 Aucun donneur compatible trouvé</p>
                <p className="text-sm mt-2">Élargissez votre rayon de recherche ou modifiez les critères</p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <h2 className="text-xl font-semibold">
                  {matches.length} donneur(s) compatible(s)
                </h2>

                {matches.map((match) => (
                  <div key={match.id} className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {match.donor.user?.first_name} {match.donor.user?.last_name}
                          </h3>
                          {match.donor.certified && (
                            <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded">✅ Certifié</span>
                          )}
                          {match.donor.availability_status !== 'green' && (
                            <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded">⏳ Indisponible</span>
                          )}
                        </div>
                        <p className="text-sm text-white/60">
                          🩸 {match.donor.blood_type} · {match.donor.donation_types?.join(", ") || "Aucun type"}
                        </p>
                        <p className="text-sm text-white/40">
                          📍 {wilayaName(match.donor.wilaya_id)} · {match.donor.distance?.toFixed(1)} km
                        </p>
                        {match.donor.has_donated_before && (
                          <p className="text-xs text-green-400 mt-1">
                            ✅ Don régulier · Dernier don: {match.donor.last_donation_date || "Non précisé"}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-green-400 font-bold">{match.score}%</span>
                        <p className="text-xs text-white/40">Compatibilité</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          match.score >= 80 ? "bg-green-600/20 text-green-400" :
                          match.score >= 50 ? "bg-yellow-600/20 text-yellow-400" :
                          "bg-red-600/20 text-red-400"
                        }`}>
                          {match.compatibility || "Compatible"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button className="px-3 py-1 bg-white/10 text-white text-sm rounded hover:bg-white/20 transition">
                        💬 Contacter
                      </button>
                      <button className="px-3 py-1 bg-red-600/20 text-red-400 text-sm rounded hover:bg-red-600/30 transition">
                        📋 Voir le profil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

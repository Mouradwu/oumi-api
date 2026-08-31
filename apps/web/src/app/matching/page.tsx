"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface Match {
  id: number;
  donor: {
    id: number;
    first_name: string;
    last_name: string;
    blood_group: string;
    donation_types: string[];
    wilaya: string;
    distance: number;
  };
  score: number;
}

export default function MatchingPage() {
  const { user } = useAuth();
  const [requestId, setRequestId] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleFind = async () => {
    if (!requestId) return;
    setLoading(true);
    setError("");
    setMatches([]);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("'$apiBase'/matching/find/" + requestId, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur de matching");
      setMatches(data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-white/60 hover:text-white transition">&larr; Retour</Link>
        <h1 className="text-3xl font-bold mt-6">🤝 Matching automatique</h1>
        <p className="text-white/50 mt-2">Trouvez des donneurs compatibles en quelques secondes</p>

        <div className="mt-6 flex gap-4">
          <input
            type="text"
            placeholder="ID de la demande"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
          />
          <button
            onClick={handleFind}
            disabled={loading}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? "Recherche..." : "🔍 Trouver"}
          </button>
        </div>

        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mt-4">{error}</div>}
        {success && matches.length === 0 && (
          <div className="bg-yellow-500/20 text-yellow-400 p-3 rounded-lg mt-4">
            Aucun donneur compatible trouvé dans la région
          </div>
        )}

        {matches.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">{matches.length} donneur(s) compatible(s)</h2>
            {matches.map((match) => (
              <div key={match.id} className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">
                      {match.donor.first_name} {match.donor.last_name}
                    </h3>
                    <p className="text-sm text-white/60">
                      🩸 {match.donor.blood_group} · {match.donor.donation_types.join(", ")}
                    </p>
                    <p className="text-sm text-white/40">
                      📍 Wilaya {match.donor.wilaya} · {match.donor.distance.toFixed(1)} km
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-green-400 font-bold">{match.score}%</span>
                    <p className="text-xs text-white/40">Compatibilité</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
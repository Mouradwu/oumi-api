"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Header from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { API_URL } from "@/lib/api";
import { toArray } from "@/lib/safe";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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

  const urgencyStyle = (level: string) => {
    if (level === 'critical') return 'bg-vital-light text-vital-dark';
    if (level === 'urgent' || level === 'important') return 'bg-amber-light text-amber';
    return 'bg-recovery-light text-recovery-dark';
  };

  if (loadingRequests) {
    return <div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Chargement...</div>;
  }

  return (
    <ErrorBoundary fallbackTitle="Erreur d'affichage du matching">
    <div className="min-h-screen bg-paper text-ink pb-safe-nav">
      <Header />
      <main className="container mx-auto px-5 md:px-6 py-8 max-w-3xl">
        <h1 className="font-display text-2xl font-bold text-ink">Matching automatique</h1>
        <p className="text-slate mt-1 text-sm">Trouvez des donneurs compatibles à partir de vos demandes.</p>

        {viewMode === "list" ? (
          <>
            <div className="mt-6 space-y-3">
              <h2 className="text-sm font-semibold text-ink">Demandes en cours</h2>
              {requests.length === 0 ? (
                <div className="bg-amber-light text-amber p-4 rounded-xl text-sm">Aucune demande active. Créez-en une !</div>
              ) : (
                requests.map((req: any) => (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req.id)}
                    className={`p-4 border rounded-2xl cursor-pointer transition-colors ${selectedRequest === req.id ? "border-vital bg-vital-light" : "border-line bg-surface hover:border-slate"}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-ink text-sm">{req.blood_type} · {req.donation_type}</h3>
                        <p className="text-sm text-slate mt-0.5">{req.hospital_name || "Établissement non précisé"}</p>
                        <p className="text-xs text-slate mt-0.5">{wilayaName(req.wilaya_id)}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${urgencyStyle(req.urgency_level)}`}>{req.urgency_level}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {requests.length > 0 && (
              <button onClick={handleFindMatches} disabled={!selectedRequest || loading} className="mt-6 w-full bg-vital hover:bg-vital-dark text-white font-semibold py-3.5 rounded-full transition-colors disabled:opacity-50">
                {loading ? "Recherche en cours..." : "Trouver des donneurs compatibles"}
              </button>
            )}
          </>
        ) : (
          <>
            <button onClick={() => setViewMode("list")} className="mt-4 text-sm text-slate hover:text-ink transition-colors">&larr; Retour à la liste des demandes</button>
            {error && <div className="bg-vital-light text-vital-dark p-3 rounded-xl mt-4 text-sm">{error}</div>}

            {matches.length === 0 ? (
              <div className="bg-amber-light text-amber p-6 rounded-2xl mt-6">
                <p className="font-semibold">Aucun donneur compatible trouvé</p>
                <p className="text-sm mt-1">Élargissez votre rayon de recherche ou modifiez les critères.</p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <h2 className="text-sm font-semibold text-ink">{matches.length} donneur(s) compatible(s)</h2>
                {matches.map((match) => (
                  <div key={match.id} className="bg-surface p-4 rounded-2xl border border-line">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-ink text-sm">{match.donor.user?.first_name} {match.donor.user?.last_name}</h3>
                          {match.donor.certified && <span className="text-xs bg-brand-light text-brand-dark px-2 py-0.5 rounded-full font-medium">Certifié</span>}
                          {match.donor.availability_status !== 'green' && <span className="text-xs bg-amber-light text-amber px-2 py-0.5 rounded-full font-medium">Indisponible</span>}
                        </div>
                        <p className="text-sm text-slate mt-0.5">{match.donor.blood_type} · {toArray(match.donor.donation_types).join(", ") || "Aucun type"}</p>
                        <p className="text-xs text-slate mt-0.5">{wilayaName(match.donor.wilaya_id)} · {match.donor.distance?.toFixed(1)} km</p>
                        {match.donor.has_donated_before && (
                          <p className="text-xs text-recovery-dark mt-1">Don régulier · Dernier don : {match.donor.last_donation_date || "Non précisé"}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-vital font-bold">{match.score}%</span>
                        <p className="text-xs text-slate">Compatibilité</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button className="px-3 py-1.5 bg-mist text-ink text-xs rounded-full hover:bg-line transition-colors">Contacter</button>
                      <button className="px-3 py-1.5 bg-vital-light text-vital-dark text-xs rounded-full hover:opacity-80 transition-opacity">Voir le profil</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <BottomNav />
    </div>
    </ErrorBoundary>
  );
}

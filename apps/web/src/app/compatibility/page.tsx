"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const PRODUCTS: { value: string; label: string; icon: string }[] = [
  { value: "SANG", label: "Sang", icon: "🩸" },
  { value: "PLASMA", label: "Plasma", icon: "💧" },
  { value: "PLAQUETTES", label: "Plaquettes", icon: "🩸" },
];

const RADIUS_STEPS = [10, 25, 50];

interface CompatibleDonor {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string | null;
  blood_type: string;
  wilaya_id: number | null;
  wilaya_name: string | null;
  availability_status: string;
  distance_km: number | null;
  compatible: boolean;
  is_universal_donor: boolean;
  badge: string | null;
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export default function CompatibilityPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [product, setProduct] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [autoFilled, setAutoFilled] = useState(false);

  const [scope, setScope] = useState<"nearby" | "wilaya" | "country">("nearby");
  const [radiusKm, setRadiusKm] = useState(10);
  const [wilayas, setWilayas] = useState<{ id: number; code: string; name_fr: string }[]>([]);
  const [wilayaId, setWilayaId] = useState<number | "">("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);

  const [results, setResults] = useState<CompatibleDonor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState<string | null>(null);

  const [summary, setSummary] = useState<{ can_give_to: string[]; can_receive_from: string[]; badge: string | null } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Des que produit + groupe sont choisis, charge immediatement le resume
  // DONNER A / RECEVOIR DE - avant meme de lancer la recherche.
  useEffect(() => {
    if (!product || !bloodType) {
      setSummary(null);
      return;
    }
    setSummaryLoading(true);
    fetch(`${API_URL}/compatibility/summary?blood_type=${encodeURIComponent(bloodType)}&product=${product}`)
      .then((res) => res.json())
      .then((data) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));
  }, [product, bloodType]);

  // Pre-remplit le groupe sanguin depuis le profil donneur existant de
  // l'utilisateur, sans jamais le deviner s'il n'existe pas.
  useEffect(() => {
    if (!user) return;
    const token = getToken();
    fetch(`${API_URL}/donors/me?userId=${user.id}`, { headers: { Authorization: "Bearer " + token } })
      .then((res) => (res.status === 404 ? null : res.json()))
      .then((data) => {
        if (data?.blood_type) {
          setBloodType(data.blood_type);
          setAutoFilled(true);
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    fetch(`${API_URL}/wilayas`)
      .then((res) => res.json())
      .then((data) => setWilayas(Array.isArray(data) ? data : []))
      .catch(() => setWilayas([]));
  }, []);

  const runSearch = async (overrides?: { radiusKm?: number; scope?: "nearby" | "wilaya" | "country" }) => {
    const effectiveScope = overrides?.scope ?? scope;
    const effectiveRadius = overrides?.radiusKm ?? radiusKm;
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const params = new URLSearchParams({ blood_type: bloodType, product });
      if (effectiveScope === "nearby" && coords) {
        params.append("lat", String(coords.lat));
        params.append("lng", String(coords.lng));
        params.append("radius_km", String(effectiveRadius));
      } else if (effectiveScope === "wilaya" && wilayaId) {
        params.append("wilaya_id", String(wilayaId));
      }
      // "country" (Toute l'Algérie) : aucun filtre géographique
      const res = await fetch(`${API_URL}/donors/compatible?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur de recherche");
      setResults(data.data || []);
      setTotal(data.total ?? 0);
    } catch (e: any) {
      setError(e.message || "Erreur de recherche");
    } finally {
      setLoading(false);
    }
  };

  const useNearby = () => {
    if (!navigator.geolocation) {
      setGeoDenied(true);
      setScope("wilaya");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setScope("nearby");
        setRadiusKm(10);
        runSearch({ scope: "nearby", radiusKm: 10 });
      },
      () => {
        setGeoDenied(true);
        setScope("wilaya");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const expandRadius = () => {
    const idx = RADIUS_STEPS.indexOf(radiusKm);
    const next = RADIUS_STEPS[idx + 1];
    if (next) {
      setRadiusKm(next);
      runSearch({ radiusKm: next });
    } else {
      setScope("wilaya");
    }
  };

  const sendRequest = async (donor: CompatibleDonor) => {
    if (!user) {
      alert("Connectez-vous pour envoyer une demande.");
      return;
    }
    setSending(donor.id);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          userId: donor.user_id,
          title: `Demande de ${product === "SANG" ? "sang" : product === "PLASMA" ? "plasma" : "plaquettes"}`,
          body: `${user.first_name} recherche un don de ${product.toLowerCase()} compatible (${bloodType}).`,
          type: "request",
          data: { receiverId: user.id, receiverName: `${user.first_name} ${user.last_name || ""}`.trim(), product, bloodType },
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        alert("Vous avez déjà une demande active envers cette personne.");
      } else if (!res.ok) {
        throw new Error(data.message || "Erreur");
      } else {
        alert("✅ Demande envoyée !");
      }
    } catch (e: any) {
      alert("Erreur : " + (e.message || "inconnue"));
    } finally {
      setSending(null);
    }
  };

  const reset = () => {
    setStep(1);
    setSearched(false);
    setResults([]);
  };

  return (
    <ErrorBoundary fallbackTitle="Erreur d'affichage de la compatibilité">
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Header />
      <main className="container mx-auto px-6 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">🩸 Compatibilité sanguine</h1>
        <p className="text-white/50 mb-8 text-sm">
          Trouvez des donneurs compatibles inscrits sur la plateforme, à proximité de vous.
        </p>

        {step === 1 && (
          <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-6">
            <div>
              <label className="block text-sm text-white/60 mb-3">De quel produit avez-vous besoin ?</label>
              <div className="grid grid-cols-3 gap-3">
                {PRODUCTS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setProduct(p.value)}
                    className={`p-4 rounded-xl text-sm font-medium transition ${product === p.value ? "bg-red-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
                  >
                    <div className="text-2xl mb-1">{p.icon}</div>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-3">
                Votre groupe sanguin
                {autoFilled && <span className="text-green-400 ml-2 text-xs">(pré-rempli depuis votre profil)</span>}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_TYPES.map((bt) => (
                  <button
                    key={bt}
                    onClick={() => { setBloodType(bt); setAutoFilled(false); }}
                    className={`py-3 rounded-lg text-sm font-semibold transition ${bloodType === bt ? "bg-red-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
                  >
                    {bt}
                  </button>
                ))}
              </div>
              {!bloodType && (
                <p className="text-xs text-white/30 mt-2">
                  🩸 Votre groupe sanguin n'est pas renseigné.{" "}
                  <a href="/donor/register" className="underline hover:text-white/60">Compléter mon profil</a>
                </p>
              )}
            </div>

            {product && bloodType && (
              <div className="p-5 rounded-xl border border-white/10 bg-black/20">
                {summaryLoading ? (
                  <p className="text-sm text-white/40">Calcul de la compatibilité...</p>
                ) : summary ? (
                  <>
                    <p className="text-sm mb-4">
                      🩸 Vous êtes du groupe sanguin <span className="font-semibold">{bloodType}</span>.
                      {summary.badge && <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-600/20 text-yellow-400 rounded">{summary.badge}</span>}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Donner à</p>
                        <div className="flex flex-wrap gap-1.5">
                          {summary.can_give_to.map((bt) => (
                            <span key={bt} className="px-2 py-1 bg-red-600/20 text-red-300 rounded text-sm font-medium">{bt}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Recevoir de</p>
                        <div className="flex flex-wrap gap-1.5">
                          {summary.can_receive_from.map((bt) => (
                            <span key={bt} className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-sm font-medium">{bt}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            )}

            <button
              disabled={!product || !bloodType}
              onClick={() => { setStep(2); useNearby(); }}
              className="w-full px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-white/90 transition disabled:opacity-30"
            >
              🔎 Rechercher des donneurs compatibles
            </button>
          </div>
        )}

        {step === 2 && (
          <>
            <button onClick={reset} className="text-sm text-white/50 hover:text-white mb-4 transition">← Modifier ma recherche</button>

            <div className="bg-white/5 p-5 rounded-xl border border-white/10 mb-6">
              <p className="text-sm mb-2">
                🩸 Vous êtes <span className="font-semibold">{bloodType}</span>
                {summary?.badge && <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-600/20 text-yellow-400 rounded">{summary.badge}</span>}
              </p>
              {summary && (
                <p className="text-sm text-white/60">
                  Recevoir de : {summary.can_receive_from.join(", ")}
                </p>
              )}
              {searched && !loading && (
                <p className="text-sm text-white/60 mt-1">{total} donneur{total > 1 ? "s" : ""} compatible{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <button onClick={useNearby} className={`px-4 py-2 rounded-full text-sm transition ${scope === "nearby" ? "bg-red-600" : "bg-white/10 hover:bg-white/20"}`}>
                📍 Autour de moi {scope === "nearby" && `(${radiusKm} km)`}
              </button>
              <select
                value={wilayaId}
                onChange={(e) => { const v = e.target.value ? Number(e.target.value) : ""; setWilayaId(v); setScope("wilaya"); if (v) runSearch({ scope: "wilaya" }); }}
                className="px-3 py-2 bg-white/10 rounded-full text-sm border-none"
              >
                <option value="">🏛️ Ma wilaya</option>
                {wilayas.map((w) => <option key={w.id} value={w.id}>{w.name_fr}</option>)}
              </select>
              <button
                onClick={() => { setScope("country"); setWilayaId(""); runSearch({ scope: "country" }); }}
                className={`px-4 py-2 rounded-full text-sm transition ${scope === "country" ? "bg-red-600" : "bg-white/10 hover:bg-white/20"}`}
              >
                🇩🇿 Toute l'Algérie
              </button>
            </div>

            {geoDenied && scope !== "nearby" && (
              <div className="bg-yellow-500/10 text-yellow-400 text-xs p-3 rounded-lg mb-4">
                Localisation indisponible — utilisez la recherche par wilaya ou pays.
              </div>
            )}
            {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            {loading && <div className="text-center py-12 text-white/50">Recherche en cours...</div>}

            {!loading && searched && results.length === 0 && (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                <p className="text-2xl mb-3">😔</p>
                <p className="text-white/60 mb-4">Aucun donneur compatible trouvé à proximité.</p>
                <div className="text-sm text-white/40 space-y-1">
                  {scope === "nearby" && radiusKm < 50 && (
                    <p>✓ <button onClick={expandRadius} className="underline hover:text-white/70">Essayez d'élargir votre rayon</button></p>
                  )}
                  <p>✓ Recherchez dans toute la wilaya ou le pays</p>
                </div>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-3">
                {results.map((d) => (
                  <div key={d.id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{d.first_name} {d.last_name || ""}</span>
                        <span className="text-xs px-2 py-0.5 bg-red-600/20 text-red-400 rounded">{d.blood_type}</span>
                        {d.badge && <span className="text-xs px-2 py-0.5 bg-yellow-600/20 text-yellow-400 rounded">{d.badge}</span>}
                      </div>
                      <p className="text-sm text-white/50 mt-1">
                        📍 {d.wilaya_name || "Wilaya non précisée"}
                        {typeof d.distance_km === "number" && <> · 📏 {d.distance_km} km</>}
                      </p>
                      <p className="text-xs mt-1">
                        {d.availability_status === "green" ? <span className="text-green-400">🟢 Disponible</span> : <span className="text-white/30">⚪ Indisponible</span>}
                        <span className="text-green-400 ml-2">✅ Compatible</span>
                      </p>
                    </div>
                    <button
                      onClick={() => sendRequest(d)}
                      disabled={sending === d.id}
                      className="shrink-0 px-4 py-2 bg-white text-black text-sm rounded-full font-medium hover:bg-white/90 transition disabled:opacity-50"
                    >
                      {sending === d.id ? "..." : "Envoyer une demande"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-white/30 mt-8 text-center">
              ⚠️ La compatibilité affichée est indicative et ne remplace jamais la validation d'un professionnel de santé ou d'un service de transfusion.
            </p>
          </>
        )}
      </main>
    </div>
    </ErrorBoundary>
  );
}

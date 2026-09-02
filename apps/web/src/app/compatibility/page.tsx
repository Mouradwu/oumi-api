"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const PRODUCTS: { value: string; label: string; icon: string }[] = [
  { value: "SANG", label: "Sang", icon: "M12 3s7 7.5 7 12a7 7 0 1 1-14 0c0-4.5 7-12 7-12Z" },
  { value: "PLASMA", label: "Plasma", icon: "M12 3s6 6.5 6 10.5a6 6 0 1 1-12 0C6 9.5 12 3 12 3Z" },
  { value: "PLAQUETTES", label: "Plaquettes", icon: "M12 2v20M2 12h20" },
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
        alert("Demande envoyée.");
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
    <div className="min-h-screen bg-paper text-ink pb-safe-nav">
      <Header />
      <main className="container mx-auto px-5 md:px-6 py-10 md:py-12 max-w-2xl">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-1.5 text-ink">Compatibilité sanguine</h1>
        <p className="text-slate mb-8 text-sm">Trouvez des donneurs compatibles inscrits sur la plateforme, à proximité de vous.</p>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-ink mb-3">De quel produit avez-vous besoin ?</label>
              <div className="grid grid-cols-3 gap-2.5">
                {PRODUCTS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setProduct(p.value)}
                    className={`p-4 rounded-2xl text-sm font-medium transition-all border ${product === p.value ? "bg-clinical border-clinical text-white shadow-soft" : "bg-white border-line text-ink hover:border-slate"}`}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={product === p.value ? "white" : "#5B6472"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2"><path d={p.icon} /></svg>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-3">
                Votre groupe sanguin
                {autoFilled && <span className="text-recovery-dark ml-2 text-xs font-normal">Pré-rempli depuis votre profil</span>}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_TYPES.map((bt) => (
                  <button
                    key={bt}
                    onClick={() => { setBloodType(bt); setAutoFilled(false); }}
                    className={`py-3 rounded-xl text-sm font-semibold transition-all border ${bloodType === bt ? "bg-vital border-vital text-white shadow-soft" : "bg-white border-line text-ink hover:border-slate"}`}
                  >
                    {bt}
                  </button>
                ))}
              </div>
              {!bloodType && (
                <p className="text-xs text-slate mt-2.5">
                  Votre groupe sanguin n'est pas renseigné. <a href="/donor/register" className="text-clinical hover:text-clinical-dark font-medium">Compléter mon profil</a>
                </p>
              )}
            </div>

            {product && bloodType && (
              <div className="p-5 rounded-2xl border border-line bg-white">
                {summaryLoading ? (
                  <p className="text-sm text-slate">Calcul de la compatibilité...</p>
                ) : summary ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <p className="text-sm text-ink">
                        Vous êtes du groupe sanguin <span className="font-semibold">{bloodType}</span>
                      </p>
                      {summary.badge && <span className="text-xs px-2.5 py-1 bg-amber-light text-amber rounded-full font-medium">{summary.badge}</span>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-slate mb-2">Donner à</p>
                        <div className="flex flex-wrap gap-1.5">
                          {summary.can_give_to.map((bt) => (
                            <span key={bt} className="px-2.5 py-1 bg-vital-light text-vital-dark rounded-full text-sm font-semibold">{bt}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate mb-2">Recevoir de</p>
                        <div className="flex flex-wrap gap-1.5">
                          {summary.can_receive_from.map((bt) => (
                            <span key={bt} className="px-2.5 py-1 bg-clinical-light text-clinical-dark rounded-full text-sm font-semibold">{bt}</span>
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
              className="w-full px-6 py-3.5 bg-clinical text-white rounded-full font-medium hover:bg-clinical-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-soft"
            >
              Rechercher des donneurs compatibles
            </button>
          </div>
        )}

        {step === 2 && (
          <>
            <button onClick={reset} className="text-sm text-slate hover:text-ink mb-5 transition-colors flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              Modifier ma recherche
            </button>

            <div className="p-5 rounded-2xl border border-line bg-white mb-6">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-sm text-ink">Vous êtes <span className="font-semibold">{bloodType}</span></p>
                {summary?.badge && <span className="text-xs px-2.5 py-1 bg-amber-light text-amber rounded-full font-medium">{summary.badge}</span>}
              </div>
              {summary && <p className="text-sm text-slate">Recevoir de : {summary.can_receive_from.join(", ")}</p>}
              {searched && !loading && (
                <p className="text-sm text-slate mt-2 font-medium">{total} donneur{total > 1 ? "s" : ""} compatible{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <button onClick={useNearby} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${scope === "nearby" ? "bg-clinical border-clinical text-white" : "bg-white border-line text-ink hover:border-slate"}`}>
                Autour de moi {scope === "nearby" && `(${radiusKm} km)`}
              </button>
              <select
                value={wilayaId}
                onChange={(e) => { const v = e.target.value ? Number(e.target.value) : ""; setWilayaId(v); setScope("wilaya"); if (v) runSearch({ scope: "wilaya" }); }}
                className="px-3.5 py-2 bg-white border border-line rounded-full text-sm text-ink"
              >
                <option value="">Ma wilaya</option>
                {wilayas.map((w) => <option key={w.id} value={w.id}>{w.name_fr}</option>)}
              </select>
              <button
                onClick={() => { setScope("country"); setWilayaId(""); runSearch({ scope: "country" }); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${scope === "country" ? "bg-clinical border-clinical text-white" : "bg-white border-line text-ink hover:border-slate"}`}
              >
                Toute l'Algérie
              </button>
            </div>

            {geoDenied && scope !== "nearby" && (
              <div className="bg-amber-light text-amber text-xs p-3 rounded-xl mb-4">
                Localisation indisponible — utilisez la recherche par wilaya ou pays.
              </div>
            )}
            {error && <div className="bg-vital-light text-vital-dark p-3 rounded-xl mb-4 text-sm">{error}</div>}

            {loading && <div className="text-center py-12 text-slate text-sm">Recherche en cours...</div>}

            {!loading && searched && results.length === 0 && (
              <div className="text-center py-10 px-6 bg-white rounded-2xl border border-line">
                <p className="text-ink font-medium mb-1">Aucun donneur compatible trouvé à proximité</p>
                <p className="text-sm text-slate mb-4">Essayez d'élargir votre recherche.</p>
                <div className="flex flex-col items-center gap-2 text-sm">
                  {scope === "nearby" && radiusKm < 50 && (
                    <button onClick={expandRadius} className="text-clinical hover:text-clinical-dark font-medium">Élargir le rayon de recherche</button>
                  )}
                </div>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-2.5">
                {results.map((d) => (
                  <div key={d.id} className="bg-white p-4 rounded-2xl border border-line flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-10 h-10 rounded-full bg-mist text-slate text-sm font-semibold flex items-center justify-center shrink-0">
                        {d.first_name?.[0]?.toUpperCase() || "?"}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-ink text-sm">{d.first_name} {d.last_name || ""}</span>
                          <span className="text-xs px-2 py-0.5 bg-vital-light text-vital-dark rounded-full font-semibold">{d.blood_type}</span>
                          {d.badge && <span className="text-xs px-2 py-0.5 bg-amber-light text-amber rounded-full font-medium">{d.badge}</span>}
                        </div>
                        <p className="text-xs text-slate mt-0.5">
                          {d.wilaya_name || "Wilaya non précisée"}
                          {typeof d.distance_km === "number" && <> · {d.distance_km} km</>}
                        </p>
                        <p className="text-xs mt-0.5">
                          {d.availability_status === "green" ? <span className="text-recovery-dark">Disponible</span> : <span className="text-slate">Indisponible</span>}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => sendRequest(d)}
                      disabled={sending === d.id}
                      className="shrink-0 px-4 py-2 bg-clinical text-white text-sm rounded-full font-medium hover:bg-clinical-dark transition-colors disabled:opacity-50"
                    >
                      {sending === d.id ? "..." : "Demander"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-slate mt-8 text-center leading-relaxed">
              La compatibilité affichée est indicative et ne remplace jamais la validation d'un professionnel de santé ou d'un service de transfusion.
            </p>
          </>
        )}
      </main>
      <BottomNav />
    </div>
    </ErrorBoundary>
  );
}

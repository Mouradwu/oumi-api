"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { API_URL } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface Facility {
  id: number;
  category: string;
  name: string | null;
  name_ar: string | null;
  addr_city: string | null;
  wilaya_id: number | null;
  specialty: string | null;
  latitude: number;
  longitude: number;
  distance_km?: number;
}

const CATEGORIES: { value: string; label: string; icon: string }[] = [
  { value: "", label: "Tous", icon: "🏥" },
  { value: "pharmacy", label: "Pharmacies", icon: "💊" },
  { value: "hospital", label: "Hôpitaux", icon: "🏥" },
  { value: "clinic", label: "Cliniques", icon: "🩺" },
  { value: "doctors", label: "Cabinets médicaux", icon: "👨‍⚕️" },
  { value: "dentist", label: "Dentistes", icon: "🦷" },
];

const CATEGORY_LABELS: Record<string, string> = {
  pharmacy: "Pharmacie",
  hospital: "Hôpital",
  clinic: "Clinique",
  doctors: "Cabinet médical",
  dentist: "Dentiste",
};

export default function FacilitiesPage() {
  const [mode, setMode] = useState<"wilaya" | "nearby">("wilaya");
  const [category, setCategory] = useState("");
  const [wilayas, setWilayas] = useState<{ id: number; code: string; name_fr: string }[]>([]);
  const [wilayaId, setWilayaId] = useState<number | "">("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialty, setSpecialty] = useState("");
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "done" | "denied">("idle");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/wilayas`)
      .then((res) => res.json())
      .then((data) => setWilayas(Array.isArray(data) ? data : []))
      .catch(() => setWilayas([]));
    fetch(`${API_URL}/facilities/specialties`)
      .then((res) => res.json())
      .then((data) => setSpecialties(Array.isArray(data) ? data : []))
      .catch(() => setSpecialties([]));
  }, []);

  const searchByWilaya = async () => {
    if (!wilayaId) {
      setError("Sélectionnez une wilaya");
      return;
    }
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const params = new URLSearchParams({ wilaya_id: String(wilayaId) });
      if (category) params.append("category", category);
      if (category === "doctors" && specialty) params.append("specialty", specialty);
      const res = await fetch(`${API_URL}/facilities?${params.toString()}`);
      const data = await res.json();
      setFacilities(Array.isArray(data) ? data : []);
    } catch {
      setError("Impossible de charger les établissements");
    } finally {
      setLoading(false);
    }
  };

  const searchNearby = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur cet appareil");
      return;
    }
    setGeoStatus("locating");
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setGeoStatus("done");
        setLoading(true);
        setSearched(true);
        try {
          const params = new URLSearchParams({
            lat: String(position.coords.latitude),
            lng: String(position.coords.longitude),
            radius_km: "10",
          });
          if (category) params.append("category", category);
          if (category === "doctors" && specialty) params.append("specialty", specialty);
          const res = await fetch(`${API_URL}/facilities/nearby?${params.toString()}`);
          const data = await res.json();
          setFacilities(Array.isArray(data) ? data : []);
        } catch {
          setError("Impossible de charger les établissements proches");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setGeoStatus("denied");
        setError("Localisation refusée ou indisponible. Utilisez la recherche par wilaya à la place.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <ErrorBoundary fallbackTitle="Erreur d'affichage des établissements">
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Header />
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">🏥 Établissements de santé</h1>
        <p className="text-white/50 mb-6">
          Pharmacies, hôpitaux, cliniques, cabinets médicaux et dentistes en Algérie
          <span className="text-white/30 text-xs block mt-1">
            Données OpenStreetMap (licence ODbL) — {" "}
            <a href="https://www.openstreetmap.org/about" target="_blank" rel="noreferrer" className="underline hover:text-white/50">
              en savoir plus
            </a>
          </span>
        </p>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setMode("wilaya")}
            className={`px-5 py-2 rounded-lg text-sm transition ${mode === "wilaya" ? "bg-red-600" : "bg-white/10 hover:bg-white/20"}`}
          >
            📍 Par wilaya
          </button>
          <button
            onClick={() => setMode("nearby")}
            className={`px-5 py-2 rounded-lg text-sm transition ${mode === "nearby" ? "bg-red-600" : "bg-white/10 hover:bg-white/20"}`}
          >
            🧭 Autour de moi
          </button>
        </div>

        <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
          <label className="block text-sm text-white/60 mb-2">Type d'établissement</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => { setCategory(c.value); if (c.value !== "doctors") setSpecialty(""); }}
                className={`px-3 py-1.5 rounded-full text-sm transition ${category === c.value ? "bg-red-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          {category === "doctors" && (
            <div className="mb-4">
              <label className="block text-xs text-white/40 mb-1">Spécialité (optionnel)</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
              >
                <option value="">Toutes spécialités</option>
                {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <p className="text-xs text-white/30 mt-1">Spécialité renseignée pour une partie des cabinets seulement.</p>
            </div>
          )}

          {mode === "wilaya" ? (
            <div className="flex gap-3">
              <select
                value={wilayaId}
                onChange={(e) => setWilayaId(e.target.value ? Number(e.target.value) : "")}
                className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="">Sélectionnez une wilaya</option>
                {wilayas.map((w) => (
                  <option key={w.id} value={w.id}>{w.code} - {w.name_fr}</option>
                ))}
              </select>
              <button onClick={searchByWilaya} className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition whitespace-nowrap">
                🔍 Rechercher
              </button>
            </div>
          ) : (
            <button
              onClick={searchNearby}
              disabled={geoStatus === "locating"}
              className="w-full px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition disabled:opacity-50"
            >
              {geoStatus === "locating" ? "📡 Localisation en cours..." : "🧭 Utiliser ma position (rayon 10 km)"}
            </button>
          )}
        </div>

        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        {loading && <div className="text-center py-12 text-white/50">Recherche...</div>}

        {!loading && searched && facilities.length === 0 && !error && (
          <div className="text-center py-12 text-white/50">Aucun établissement trouvé pour ces critères.</div>
        )}

        {!loading && facilities.length > 0 && (
          <div className="space-y-3">
            {facilities.map((f) => (
              <div key={f.id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{f.name || CATEGORY_LABELS[f.category] || f.category}</p>
                  <p className="text-sm text-white/50">
                    {CATEGORY_LABELS[f.category] || f.category}
                    {f.specialty && <span className="text-blue-400"> · {f.specialty}</span>}
                    {f.addr_city ? ` · ${f.addr_city}` : ""}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  {typeof f.distance_km === "number" && (
                    <span className="text-sm text-green-400">{f.distance_km} km</span>
                  )}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${f.latitude},${f.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded transition"
                  >
                    🗺️ Itinéraire (Google Maps)
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
    </ErrorBoundary>
  );
}

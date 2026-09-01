"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";

interface Donor {
  id: string;
  blood_type: string;
  donation_types: string[];
  wilaya_id: number;
  availability_status: string;
  certified: boolean;
  has_donated_before: boolean;
  last_donation_date: string | null;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
}

export default function ExploreDonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [wilayas, setWilayas] = useState<{ id: number; code: string; name_fr: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    blood_type: "",
    donation_type: "",
    wilaya_id: "" as number | "",
    availability_status: "green",
  });

  const wilayaName = (id: number) => wilayas.find((w) => w.id === id)?.name_fr || `#${id}`;

  useEffect(() => {
    fetch(`${API_URL}/wilayas`)
      .then((res) => res.json())
      .then((data) => setWilayas(Array.isArray(data) ? data : []))
      .catch(() => setWilayas([]));
  }, []);

  useEffect(() => {
    fetchDonors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchDonors = async () => {
    setLoading(true);
    setError("");
    try {
      const queryParams = new URLSearchParams();
      if (filters.blood_type) queryParams.append("blood_type", filters.blood_type);
      if (filters.donation_type) queryParams.append("donation_type", filters.donation_type);
      if (filters.wilaya_id) queryParams.append("wilaya_id", String(filters.wilaya_id));
      if (filters.availability_status) queryParams.append("availability_status", filters.availability_status);

      const res = await fetch(`${API_URL}/donors?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Erreur lors de la récupération des donneurs");
      const data = await res.json();
      setDonors(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-white/60 hover:text-white transition">&larr; Retour</Link>
        <h1 className="text-3xl font-bold mt-6">🔍 Explorer les donneurs</h1>

        {/* Filtres */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Groupe sanguin</label>
            <select
              value={filters.blood_type}
              onChange={(e) => handleFilterChange("blood_type", e.target.value)}
              className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white"
            >
              <option value="">Tous</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Type de don</label>
            <select
              value={filters.donation_type}
              onChange={(e) => handleFilterChange("donation_type", e.target.value)}
              className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white"
            >
              <option value="">Tous</option>
              <option value="SANG">🩸 Sang</option>
              <option value="PLASMA">💧 Plasma</option>
              <option value="PLAQUETTES">🧬 Plaquettes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Wilaya</label>
            <select
              value={filters.wilaya_id}
              onChange={(e) => handleFilterChange("wilaya_id", e.target.value ? Number(e.target.value) : "")}
              className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white"
            >
              <option value="">Toutes</option>
              {wilayas.map((w) => (
                <option key={w.id} value={w.id}>{w.code} - {w.name_fr}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => fetchDonors()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition"
            >
              🔍 Rechercher
            </button>
          </div>
        </div>

        {/* Résultats */}
        {loading ? (
          <div className="text-center py-20 text-white/50">Chargement des donneurs...</div>
        ) : error ? (
          <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mt-6">{error}</div>
        ) : donors.length === 0 ? (
          <div className="text-center py-20 text-white/50">Aucun donneur trouvé avec ces critères.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {donors.map((donor) => (
              <div key={donor.id} className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-red-500/30 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{donor.user.first_name} {donor.user.last_name}</h3>
                    <p className="text-sm text-white/60">🩸 {donor.blood_type}</p>
                    <p className="text-sm text-white/60">📦 {donor.donation_types?.join(", ")}</p>
                    <p className="text-sm text-white/40">📍 {wilayaName(donor.wilaya_id)}</p>
                  </div>
                  <div className="text-right">
                    {donor.availability_status === 'green' ? (
                      <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">✅ Disponible</span>
                    ) : (
                      <span className="text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded">⛔ Indisponible</span>
                    )}
                    {donor.certified && <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded ml-1">✅ Certifié</span>}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="px-3 py-1 bg-red-600/20 text-red-400 text-sm rounded hover:bg-red-600/30 transition">
                    💬 Contacter
                  </button>
                  <button className="px-3 py-1 bg-white/10 text-white text-sm rounded hover:bg-white/20 transition">
                    📋 Voir profil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

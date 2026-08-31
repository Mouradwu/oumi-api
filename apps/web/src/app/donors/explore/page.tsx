"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Donor {
  id: number;
  blood_group: string;
  donation_types: string[];
  wilaya: string;
  availability: boolean;
  certified: boolean;
  has_donated_before: boolean;
  last_donation_date: string | null;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
}

export default function ExploreDonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    blood_group: "",
    donation_type: "",
    wilaya: "",
    availability: true,
  });

  useEffect(() => {
    fetchDonors();
  }, [filters]);

  const fetchDonors = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      if (filters.blood_group) queryParams.append("blood_group", filters.blood_group);
      if (filters.donation_type) queryParams.append("donation_type", filters.donation_type);
      if (filters.wilaya) queryParams.append("wilaya", filters.wilaya);
      if (filters.availability) queryParams.append("availability", "true");

      const res = await fetch(`https://oumiapi-production.up.railway.app/donors?${queryParams.toString()}`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
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
              value={filters.blood_group}
              onChange={(e) => handleFilterChange("blood_group", e.target.value)}
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
            <input
              type="text"
              placeholder="Ex: 16"
              value={filters.wilaya}
              onChange={(e) => handleFilterChange("wilaya", e.target.value)}
              className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
            />
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
                    <p className="text-sm text-white/60">🩸 {donor.blood_group}</p>
                    <p className="text-sm text-white/60">📦 {donor.donation_types.join(", ")}</p>
                    <p className="text-sm text-white/40">📍 Wilaya {donor.wilaya}</p>
                  </div>
                  <div className="text-right">
                    {donor.availability ? (
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

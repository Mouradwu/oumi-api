"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function DonorRegisterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Profil donneur (tous les champs)
  const [donor, setDonor] = useState({
    blood_group: "",
    donation_types: [] as string[],   // ← plusieurs types possibles
    wilaya: "",
    latitude: 0,
    longitude: 0,
    availability: true,
    certified: false,
    has_donated_before: false,
    last_donation_date: "",
  });

  // Récupérer la position GPS
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDonor(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
        },
        () => console.log("Position non disponible")
      );
    }
  }, []);

  // Si l'utilisateur n'est pas connecté, rediriger vers login
  if (!user) {
    router.push("/auth/login");
    return null;
  }

  const toggleDonationType = (type: string) => {
    setDonor(prev => ({
      ...prev,
      donation_types: prev.donation_types.includes(type)
        ? prev.donation_types.filter(t => t !== type)  // Retirer
        : [...prev.donation_types, type],              // Ajouter
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // Validation : au moins un type de don sélectionné
    if (donor.donation_types.length === 0) {
      setError("Veuillez sélectionner au moins un type de don (Sang, Plasma, Plaquettes)");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("'$apiBase'/donors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          ...donor,
          userId: user.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur d'enregistrement");
      setSuccess(true);
      setTimeout(() => router.push("/donor/profile"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/donor/profile" className="text-white/60 hover:text-white transition">&larr; Retour</Link>
        <h1 className="text-3xl font-bold mt-6">🩸 Devenir donneur</h1>
        <p className="text-white/50 mt-2">Renseignez vos informations pour sauver des vies</p>

        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mt-4">{error}</div>}
        {success && (
          <div className="bg-green-500/20 text-green-400 p-3 rounded-lg mt-4">
            ✅ Profil enregistré ! Redirection vers votre profil...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* Groupe sanguin */}
          <div>
            <label className="block text-sm text-white/60 mb-1">Groupe sanguin *</label>
            <select
              value={donor.blood_group}
              onChange={(e) => setDonor({ ...donor, blood_group: e.target.value })}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
              required
            >
              <option value="">Sélectionnez</option>
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

          {/* Types de don (multi-sélection) */}
          <div>
            <label className="block text-sm text-white/60 mb-1">Types de don * (sélectionnez un ou plusieurs)</label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: "SANG", label: "🩸 Sang", color: "red" },
                { value: "PLASMA", label: "💧 Plasma", color: "blue" },
                { value: "PLAQUETTES", label: "🧬 Plaquettes", color: "yellow" },
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleDonationType(value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    donor.donation_types.includes(value)
                      ? `bg-${color}-600 text-white`
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {donor.donation_types.length > 0 && (
              <p className="text-green-400 text-xs mt-1">
                ✅ {donor.donation_types.length} type(s) sélectionné(s) : {donor.donation_types.join(", ")}
              </p>
            )}
          </div>

          {/* Wilaya */}
          <div>
            <label className="block text-sm text-white/60 mb-1">Wilaya *</label>
            <input
              type="text"
              placeholder="Ex: 16 (Alger)"
              value={donor.wilaya}
              onChange={(e) => setDonor({ ...donor, wilaya: e.target.value })}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
              required
            />
          </div>

          {/* GPS (latitude/longitude) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                placeholder="36.75"
                value={donor.latitude}
                onChange={(e) => setDonor({ ...donor, latitude: parseFloat(e.target.value) || 0 })}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                placeholder="3.05"
                value={donor.longitude}
                onChange={(e) => setDonor({ ...donor, longitude: parseFloat(e.target.value) || 0 })}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
              />
            </div>
          </div>

          {/* Statut du donneur */}
          <div className="space-y-3 border border-white/10 p-4 rounded-lg">
            <h3 className="text-sm font-semibold">📋 Statut du donneur</h3>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={donor.has_donated_before}
                onChange={(e) => setDonor({ ...donor, has_donated_before: e.target.checked })}
                className="w-4 h-4 accent-red-600"
              />
              <label className="text-sm text-white/60">J'ai déjà donné (certifié)</label>
            </div>

            {donor.has_donated_before && (
              <div>
                <label className="block text-sm text-white/60 mb-1">Date du dernier don</label>
                <input
                  type="date"
                  value={donor.last_donation_date}
                  onChange={(e) => setDonor({ ...donor, last_donation_date: e.target.value })}
                  className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white"
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={donor.certified}
                onChange={(e) => setDonor({ ...donor, certified: e.target.checked })}
                className="w-4 h-4 accent-green-600"
              />
              <label className="text-sm text-white/60">
                ✅ Certifié médicalement (document justificatif)
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={donor.availability}
                onChange={(e) => setDonor({ ...donor, availability: e.target.checked })}
                className="w-4 h-4 accent-red-600"
              />
              <label className="text-sm text-white/60">Disponible pour donner maintenant</label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Enregistrement..." : "💾 Enregistrer mon profil donneur"}
          </button>
        </form>
      </div>
    </div>
  );
}
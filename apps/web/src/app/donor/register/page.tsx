"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function DonorRegisterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [donor, setDonor] = useState({
    blood_group: "",
    donation_types: [] as string[],
    wilaya: "",
    availability: true,
    certified: false,
    has_donated_before: false,
    last_donation_date: "",
  });

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  const toggleDonationType = (type: string) => {
    setDonor(prev => ({
      ...prev,
      donation_types: prev.donation_types.includes(type)
        ? prev.donation_types.filter(t => t !== type)
        : [...prev.donation_types, type],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    if (donor.donation_types.length === 0) {
      setError("Veuillez sélectionner au moins un type de don");
      setLoading(false);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const payload = { ...donor, userId: user.id, latitude: 0, longitude: 0 };
      const res = await fetch("https://oumiapi-production.up.railway.app/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error("Erreur serveur"); }
      if (!res.ok) throw new Error(data.message || "Erreur d'enregistrement");
      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-white/60 hover:text-white transition">&larr; Retour</Link>
        <h1 className="text-3xl font-bold mt-6">🩸 Devenir donneur</h1>
        <p className="text-white/50 mt-2">Renseignez vos informations pour sauver des vies</p>
        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mt-4">{error}</div>}
        {success && <div className="bg-green-500/20 text-green-400 p-3 rounded-lg mt-4">✅ Profil enregistré !</div>}
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="block text-sm text-white/60 mb-1">Groupe sanguin *</label>
            <select value={donor.blood_group} onChange={(e) => setDonor({ ...donor, blood_group: e.target.value })} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white" required>
              <option value="">Sélectionnez</option>
              <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Types de don *</label>
            <div className="flex flex-wrap gap-3">
              {["SANG","PLASMA","PLAQUETTES"].map(type => (
                <button key={type} type="button" onClick={() => toggleDonationType(type)} className={`px-4 py-2 rounded-full text-sm font-medium transition ${donor.donation_types.includes(type) ? "bg-red-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>
                  {type === "SANG" && "🩸 Sang"}{type === "PLASMA" && "💧 Plasma"}{type === "PLAQUETTES" && "🧬 Plaquettes"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Wilaya *</label>
            <input type="text" placeholder="Ex: 16" value={donor.wilaya} onChange={(e) => setDonor({ ...donor, wilaya: e.target.value })} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40" required />
          </div>
          <div className="space-y-3 border border-white/10 p-4 rounded-lg">
            <h3 className="text-sm font-semibold">📋 Statut</h3>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={donor.has_donated_before} onChange={(e) => setDonor({ ...donor, has_donated_before: e.target.checked })} className="w-4 h-4 accent-red-600" />
              <label className="text-sm text-white/60">J'ai déjà donné</label>
            </div>
            {donor.has_donated_before && (
              <div>
                <label className="block text-sm text-white/60 mb-1">Date du dernier don</label>
                <input type="date" value={donor.last_donation_date} onChange={(e) => setDonor({ ...donor, last_donation_date: e.target.value })} className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
            )}
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={donor.certified} onChange={(e) => setDonor({ ...donor, certified: e.target.checked })} className="w-4 h-4 accent-green-600" />
              <label className="text-sm text-white/60">✅ Certifié médicalement</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={donor.availability} onChange={(e) => setDonor({ ...donor, availability: e.target.checked })} className="w-4 h-4 accent-red-600" />
              <label className="text-sm text-white/60">Disponible pour donner</label>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50">{loading ? "Enregistrement..." : "💾 Enregistrer"}</button>
        </form>
      </div>
    </div>
  );
}

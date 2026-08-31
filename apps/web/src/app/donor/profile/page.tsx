"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function DonorProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    blood_group: "",
    donation_types: [] as string[],
    wilaya: "",
    latitude: 0,
    longitude: 0,
    availability: true,
  });

  // Récupérer la position GPS
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setForm(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
        },
        () => console.log("Position non disponible")
      );
    }
  }, []);

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://oumiapi-production.up.railway.app/donors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          ...form,
          userId: user.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur d'enregistrement");
      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDonationType = (type: string) => {
    setForm(prev => ({
      ...prev,
      donation_types: prev.donation_types.includes(type)
        ? prev.donation_types.filter(t => t !== type)
        : [...prev.donation_types, type],
    }));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-white/60 hover:text-white transition">&larr; Retour</Link>
        <h1 className="text-3xl font-bold mt-6">🩸 Profil donneur</h1>
        <p className="text-white/50 mt-2">Renseignez vos informations pour sauver des vies</p>

        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mt-4">{error}</div>}
        {success && <div className="bg-green-500/20 text-green-400 p-3 rounded-lg mt-4">✅ Profil enregistré ! Redirection...</div>}

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="block text-sm text-white/60 mb-1">Groupe sanguin *</label>
            <select
              value={form.blood_group}
              onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
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

          <div>
            <label className="block text-sm text-white/60 mb-1">Types de don *</label>
            <div className="flex flex-wrap gap-3">
              {["SANG", "PLASMA", "PLAQUETTES"].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleDonationType(type)}
                  className={px-4 py-2 rounded-full text-sm transition }
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Wilaya</label>
            <input
              type="text"
              placeholder="Ex: 16"
              value={form.wilaya}
              onChange={(e) => setForm({ ...form, wilaya: e.target.value })}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                placeholder="36.75"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                placeholder="3.05"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.availability}
              onChange={(e) => setForm({ ...form, availability: e.target.checked })}
              className="w-4 h-4 accent-red-600"
            />
            <label className="text-sm text-white/60">Disponible pour donner</label>
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
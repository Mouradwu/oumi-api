"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function DonorRegisterPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Étape 1 : Compte utilisateur
  const [account, setAccount] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
  });

  // Étape 2 : Profil donneur
  const [donor, setDonor] = useState({
    blood_group: "",
    donation_types: [] as string[],
    wilaya: "",
    latitude: 0,
    longitude: 0,
    availability: true,
    has_donated_before: false,
    last_donation_date: "",
    certified: false,
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

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Créer le compte
      const res = await fetch("'$apiBase'/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(account),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur d'inscription");

      // 2. Se connecter automatiquement
      await login(account.email, account.password);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDonorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

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
          userId: user?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur d'enregistrement donneur");
      setSuccess(true);
      setTimeout(() => router.push("/"), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDonationType = (type: string) => {
    setDonor(prev => ({
      ...prev,
      donation_types: prev.donation_types.includes(type)
        ? prev.donation_types.filter(t => t !== type)
        : [...prev.donation_types, type],
    }));
  };

  // Étape 1 : Création de compte
  if (step === 1) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <Logo size={36} />
          <h1 className="text-2xl font-bold text-center">🩸 Devenir donneur</h1>
          <p className="text-white/50 text-center">Étape 1/2 : Créez votre compte</p>

          {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm">{error}</div>}

          <form onSubmit={handleAccountSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Prénom *"
              value={account.first_name}
              onChange={(e) => setAccount({ ...account, first_name: e.target.value })}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
              required
            />
            <input
              type="text"
              placeholder="Nom *"
              value={account.last_name}
              onChange={(e) => setAccount({ ...account, last_name: e.target.value })}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
              required
            />
            <input
              type="email"
              placeholder="Email *"
              value={account.email}
              onChange={(e) => setAccount({ ...account, email: e.target.value })}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
              required
            />
            <input
              type="tel"
              placeholder="Téléphone *"
              value={account.phone}
              onChange={(e) => setAccount({ ...account, phone: e.target.value })}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
              required
            />
            <input
              type="password"
              placeholder="Mot de passe *"
              value={account.password}
              onChange={(e) => setAccount({ ...account, password: e.target.value })}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Création..." : "Continuer →"}
            </button>
          </form>

          <p className="text-center text-white/50 text-sm">
            Déjà un compte ? <Link href="/auth/login" className="text-red-400 hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    );
  }

  // Étape 2 : Profil donneur
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-white/60 hover:text-white transition">&larr; Retour</Link>
        <h1 className="text-2xl font-bold mt-6">Étape 2/2 : Profil donneur</h1>
        <p className="text-white/50 mt-2">Renseignez vos informations médicales</p>

        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mt-4">{error}</div>}
        {success && (
          <div className="bg-green-500/20 text-green-400 p-3 rounded-lg mt-4">
            ✅ Profil enregistré ! Redirection vers l'accueil...
          </div>
        )}

        <form onSubmit={handleDonorSubmit} className="space-y-4 mt-6">
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

          <div>
            <label className="block text-sm text-white/60 mb-1">Types de don *</label>
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
            {donor.donation_types.length === 0 && (
              <p className="text-yellow-400 text-xs mt-1">Sélectionnez au moins un type de don</p>
            )}
          </div>

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

          <div className="space-y-2 border border-white/10 p-4 rounded-lg">
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
            disabled={loading || donor.donation_types.length === 0}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Enregistrement..." : "💾 Finaliser mon inscription"}
          </button>
        </form>
      </div>
    </div>
  );
}
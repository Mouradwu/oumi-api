"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Header from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { API_URL } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function DonorRegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [donor, setDonor] = useState({
    blood_type: "",
    donation_types: [] as string[],
    wilaya_id: "" as number | "",
    availability_status: "green",
    certified: false,
    has_donated_before: false,
    last_donation_date: "",
  });
  const [wilayas, setWilayas] = useState<{ id: number; code: string; name_fr: string }[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/wilayas`)
      .then((res) => res.json())
      .then((data) => setWilayas(Array.isArray(data) ? data : []))
      .catch(() => setWilayas([]));
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push("/auth/login?redirect=/donor/register");
  }, [user, authLoading, router]);

  if (authLoading) {
    return <div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Chargement...</div>;
  }
  if (!user) return null;

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
    if (!donor.wilaya_id) {
      setError("Veuillez sélectionner une wilaya");
      setLoading(false);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...donor,
        last_donation_date: donor.has_donated_before && donor.last_donation_date ? donor.last_donation_date : null,
        userId: user.id,
        latitude: 0,
        longitude: 0,
      };
      const res = await fetch(`${API_URL}/donors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error("Erreur serveur"); }
      if (!res.ok) throw new Error(data.message || "Erreur d'enregistrement");
      setSuccess(true);
      setTimeout(() => router.push("/profile"), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary fallbackTitle="Erreur d'affichage du formulaire donneur">
    <div className="min-h-screen bg-paper text-ink pb-safe-nav">
      <Header />
      <main className="container mx-auto px-5 md:px-6 py-8 max-w-2xl">
        <Link href="/profile" className="text-sm text-slate hover:text-ink transition-colors">&larr; Retour</Link>
        <h1 className="font-display text-2xl font-bold mt-4 text-ink">Devenir donneur</h1>
        <p className="text-slate mt-1 text-sm mb-6">Renseignez vos informations pour rejoindre les donneurs BLOODZ.</p>
        {error && <div className="bg-vital-light text-vital-dark p-3 rounded-xl mb-4 text-sm">{error}</div>}
        {success && <div className="bg-recovery-light text-recovery-dark p-3 rounded-xl mb-4 text-sm">Profil enregistré !</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Groupe sanguin *</label>
            <select value={donor.blood_type} onChange={(e) => setDonor({ ...donor, blood_type: e.target.value })} className="w-full p-3 bg-surface border border-line rounded-xl text-ink" required>
              <option value="">Sélectionnez</option>
              <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Types de don *</label>
            <div className="flex flex-wrap gap-2">
              {["SANG","PLASMA","PLAQUETTES"].map(type => (
                <button key={type} type="button" onClick={() => toggleDonationType(type)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${donor.donation_types.includes(type) ? "bg-vital border-vital text-white" : "bg-surface border-line text-ink hover:border-slate"}`}>
                  {type === "SANG" && "Sang"}{type === "PLASMA" && "Plasma"}{type === "PLAQUETTES" && "Plaquettes"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Wilaya *</label>
            <select value={donor.wilaya_id} onChange={(e) => setDonor({ ...donor, wilaya_id: e.target.value ? Number(e.target.value) : "" })} className="w-full p-3 bg-surface border border-line rounded-xl text-ink" required>
              <option value="">Sélectionnez une wilaya</option>
              {wilayas.map((w) => (
                <option key={w.id} value={w.id}>{w.code} - {w.name_fr}</option>
              ))}
            </select>
          </div>
          <div className="space-y-3 bg-surface border border-line p-4 rounded-2xl">
            <h3 className="text-sm font-semibold text-ink">Statut</h3>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={donor.has_donated_before} onChange={(e) => setDonor({ ...donor, has_donated_before: e.target.checked })} className="w-4 h-4 accent-brand" />
              <label className="text-sm text-slate">J'ai déjà donné</label>
            </div>
            {donor.has_donated_before && (
              <div>
                <label className="block text-sm text-slate mb-1">Date du dernier don</label>
                <input type="date" value={donor.last_donation_date} onChange={(e) => setDonor({ ...donor, last_donation_date: e.target.value })} className="w-full p-2.5 bg-paper border border-line rounded-lg text-ink" />
              </div>
            )}
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={donor.certified} onChange={(e) => setDonor({ ...donor, certified: e.target.checked })} className="w-4 h-4 accent-brand" />
              <label className="text-sm text-slate">Certifié médicalement</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={donor.availability_status === "green"} onChange={(e) => setDonor({ ...donor, availability_status: e.target.checked ? "green" : "red" })} className="w-4 h-4 accent-brand" />
              <label className="text-sm text-slate">Disponible pour donner</label>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-vital hover:bg-vital-dark text-white font-semibold py-3.5 rounded-full transition-colors disabled:opacity-50">
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </main>
      <BottomNav />
    </div>
    </ErrorBoundary>
  );
}

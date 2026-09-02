"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Header from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { API_URL } from "@/lib/api";
import { toArray } from "@/lib/safe";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export default function UpdateDonorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [donor, setDonor] = useState<any>(null);
  const [wilayas, setWilayas] = useState<{ id: number; code: string; name_fr: string }[]>([]);
  const [form, setForm] = useState({
    blood_type: "", donation_types: [] as string[], wilaya_id: "" as number | "",
    availability_status: "green", certified: false, has_donated_before: false, last_donation_date: "",
  });

  useEffect(() => {
    fetch(`${API_URL}/wilayas`).then((r) => r.json()).then((d) => setWilayas(Array.isArray(d) ? d : [])).catch(() => setWilayas([]));
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    const token = getToken();
    fetch(`${API_URL}/donors/me?userId=${user.id}`, { headers: { Authorization: "Bearer " + token } })
      .then((res) => (res.status === 404 ? null : res.json()))
      .then((data) => {
        if (data) {
          setDonor(data);
          setForm({
            blood_type: data.blood_type || "", donation_types: toArray(data.donation_types),
            wilaya_id: data.wilaya_id ?? "", availability_status: data.availability_status || "green",
            certified: data.certified || false, has_donated_before: data.has_donated_before || false,
            last_donation_date: data.last_donation_date || "",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const toggleDonationType = (type: string) => {
    setForm((p) => ({ ...p, donation_types: p.donation_types.includes(type) ? p.donation_types.filter((t) => t !== type) : [...p.donation_types, type] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess(false);
    if (form.donation_types.length === 0) { setError("Sélectionnez au moins un type de don"); setSaving(false); return; }
    try {
      const token = getToken();
      const payload = { ...form, last_donation_date: form.has_donated_before && form.last_donation_date ? form.last_donation_date : null };
      const res = await fetch(`${API_URL}/donors/${donor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");
      setSuccess(true);
      setTimeout(() => router.push("/profile"), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) return <div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Chargement...</div>;
  if (!user || !donor) return <div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Aucun profil donneur trouvé</div>;

  return (
    <ErrorBoundary fallbackTitle="Erreur d'affichage du formulaire">
    <div className="min-h-screen bg-paper text-ink pb-safe-nav">
      <Header />
      <main className="container mx-auto px-5 md:px-6 py-8 max-w-2xl">
        <Link href="/profile" className="text-sm text-slate hover:text-ink transition-colors">&larr; Retour</Link>
        <h1 className="font-display text-2xl font-bold mt-4 text-ink">Modifier mon profil donneur</h1>
        {error && <div className="bg-vital-light text-vital-dark p-3 rounded-xl mt-4 text-sm">{error}</div>}
        {success && <div className="bg-recovery-light text-recovery-dark p-3 rounded-xl mt-4 text-sm">Mis à jour !</div>}
        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Groupe sanguin *</label>
            <select value={form.blood_type} onChange={(e) => setForm({ ...form, blood_type: e.target.value })} className="w-full p-3 bg-surface border border-line rounded-xl text-ink" required>
              <option value="">Sélectionnez</option>
              <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Types de don *</label>
            <div className="flex flex-wrap gap-2">
              {["SANG","PLASMA","PLAQUETTES"].map(type => (
                <button key={type} type="button" onClick={() => toggleDonationType(type)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${form.donation_types.includes(type) ? "bg-vital border-vital text-white" : "bg-surface border-line text-ink hover:border-slate"}`}>
                  {type === "SANG" && "Sang"}{type === "PLASMA" && "Plasma"}{type === "PLAQUETTES" && "Plaquettes"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Wilaya</label>
            <select value={form.wilaya_id} onChange={(e) => setForm({ ...form, wilaya_id: e.target.value ? Number(e.target.value) : "" })} className="w-full p-3 bg-surface border border-line rounded-xl text-ink">
              <option value="">Sélectionnez une wilaya</option>
              {wilayas.map((w) => <option key={w.id} value={w.id}>{w.code} - {w.name_fr}</option>)}
            </select>
          </div>
          <div className="space-y-3 bg-surface border border-line p-4 rounded-2xl">
            <h3 className="text-sm font-semibold text-ink">Statut</h3>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={form.availability_status === "green"} onChange={(e) => setForm({ ...form, availability_status: e.target.checked ? "green" : "red" })} className="w-4 h-4 accent-brand" />
              <label className="text-sm text-slate">Disponible</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={form.certified} onChange={(e) => setForm({ ...form, certified: e.target.checked })} className="w-4 h-4 accent-brand" />
              <label className="text-sm text-slate">Certifié</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={form.has_donated_before} onChange={(e) => setForm({ ...form, has_donated_before: e.target.checked })} className="w-4 h-4 accent-brand" />
              <label className="text-sm text-slate">J'ai déjà donné</label>
            </div>
            {form.has_donated_before && (
              <div>
                <label className="block text-sm text-slate mb-1">Date du dernier don</label>
                <input type="date" value={form.last_donation_date} onChange={(e) => setForm({ ...form, last_donation_date: e.target.value })} className="w-full p-2.5 bg-paper border border-line rounded-lg text-ink" />
              </div>
            )}
          </div>
          <button type="submit" disabled={saving} className="w-full bg-vital hover:bg-vital-dark text-white font-semibold py-3.5 rounded-full transition-colors disabled:opacity-50">
            {saving ? "Enregistrement..." : "Mettre à jour"}
          </button>
        </form>
      </main>
      <BottomNav />
    </div>
    </ErrorBoundary>
  );
}

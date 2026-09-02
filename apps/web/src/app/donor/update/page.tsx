"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { toArray } from "@/lib/safe";

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
    blood_type: "",
    donation_types: [] as string[],
    wilaya_id: "" as number | "",
    availability_status: "green",
    certified: false,
    has_donated_before: false,
    last_donation_date: "",
  });

  useEffect(() => {
    fetch(`${API_URL}/wilayas`)
      .then((res) => res.json())
      .then((data) => setWilayas(Array.isArray(data) ? data : []))
      .catch(() => setWilayas([]));
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/donors/me?userId=${user.id}`, {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => {
        if (res.status === 404) {
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setDonor(data);
          setForm({
            blood_type: data.blood_type || "",
            donation_types: toArray(data.donation_types),
            wilaya_id: data.wilaya_id ?? "",
            availability_status: data.availability_status || "green",
            certified: data.certified || false,
            has_donated_before: data.has_donated_before || false,
            last_donation_date: data.last_donation_date || "",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, authLoading, router]);

  const toggleDonationType = (type: string) => {
    setForm(prev => ({
      ...prev,
      donation_types: prev.donation_types.includes(type)
        ? prev.donation_types.filter(t => t !== type)
        : [...prev.donation_types, type],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    if (form.donation_types.length === 0) {
      setError("Sélectionnez au moins un type de don");
      setSaving(false);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...form,
        last_donation_date: form.has_donated_before && form.last_donation_date ? form.last_donation_date : null,
      };
      const res = await fetch(`${API_URL}/donors/${donor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");
      setSuccess(true);
      setTimeout(() => router.push("/profile"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">Chargement...</div>;
  if (!user || !donor) return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">Aucun profil donneur trouvé</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/profile" className="text-white/60 hover:text-white transition">&larr; Retour</Link>
        <h1 className="text-3xl font-bold mt-6">📝 Modifier mon profil donneur</h1>
        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mt-4">{error}</div>}
        {success && <div className="bg-green-500/20 text-green-400 p-3 rounded-lg mt-4">✅ Mis à jour !</div>}
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="block text-sm text-white/60 mb-1">Groupe sanguin *</label>
            <select value={form.blood_type} onChange={(e) => setForm({ ...form, blood_type: e.target.value })} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white" required>
              <option value="">Sélectionnez</option>
              <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Types de don *</label>
            <div className="flex flex-wrap gap-3">
              {["SANG","PLASMA","PLAQUETTES"].map(type => (
                <button key={type} type="button" onClick={() => toggleDonationType(type)} className={`px-4 py-2 rounded-full text-sm font-medium transition ${form.donation_types.includes(type) ? "bg-red-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>
                  {type === "SANG" && "🩸 Sang"}{type === "PLASMA" && "💧 Plasma"}{type === "PLAQUETTES" && "🧬 Plaquettes"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Wilaya</label>
            <select value={form.wilaya_id} onChange={(e) => setForm({ ...form, wilaya_id: e.target.value ? Number(e.target.value) : "" })} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white">
              <option value="">Sélectionnez une wilaya</option>
              {wilayas.map((w) => (
                <option key={w.id} value={w.id}>{w.code} - {w.name_fr}</option>
              ))}
            </select>
          </div>
          <div className="space-y-3 border border-white/10 p-4 rounded-lg">
            <h3 className="text-sm font-semibold">Statut</h3>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={form.availability_status === "green"} onChange={(e) => setForm({ ...form, availability_status: e.target.checked ? "green" : "red" })} className="w-4 h-4 accent-red-600" />
              <label className="text-sm text-white/60">Disponible</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={form.certified} onChange={(e) => setForm({ ...form, certified: e.target.checked })} className="w-4 h-4 accent-green-600" />
              <label className="text-sm text-white/60">✅ Certifié</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={form.has_donated_before} onChange={(e) => setForm({ ...form, has_donated_before: e.target.checked })} className="w-4 h-4 accent-yellow-600" />
              <label className="text-sm text-white/60">J'ai déjà donné</label>
            </div>
            {form.has_donated_before && (
              <div>
                <label className="block text-sm text-white/60 mb-1">Date du dernier don</label>
                <input type="date" value={form.last_donation_date} onChange={(e) => setForm({ ...form, last_donation_date: e.target.value })} className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
            )}
          </div>
          <button type="submit" disabled={saving} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50">
            {saving ? "Enregistrement..." : "💾 Mettre à jour"}
          </button>
        </form>
      </div>
    </div>
  );
}

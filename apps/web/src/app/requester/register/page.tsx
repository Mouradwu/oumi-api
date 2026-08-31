"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function RequesterRegisterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    blood_group: "",
    donation_type: "SANG",
    wilaya: "",
    hospital: "",
    urgency: "NORMAL",
    description: "",
    patient_name: "",
    patient_age: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://oumiapi-production.up.railway.app/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ ...form, userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");
      setSuccess(true);
      // Ajouter le rôle "requester" à l'utilisateur
      await fetch("https://oumiapi-production.up.railway.app/users/me/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ roles: ["requester"] }),
      });
      setTimeout(() => router.push("/profile"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/profile" className="text-white/60 hover:text-white transition">&larr; Retour</Link>
        <h1 className="text-3xl font-bold mt-6">🩸 Devenir demandeur</h1>
        <p className="text-white/50 mt-2">Créez une demande de sang, plasma ou plaquettes</p>
        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mt-4">{error}</div>}
        {success && <div className="bg-green-500/20 text-green-400 p-3 rounded-lg mt-4">✅ Demande créée !</div>}
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="block text-sm text-white/60 mb-1">Type de besoin *</label>
            <select value={form.donation_type} onChange={(e) => setForm({ ...form, donation_type: e.target.value })} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white">
              <option value="SANG">🩸 Sang</option>
              <option value="PLASMA">💧 Plasma</option>
              <option value="PLAQUETTES">🧬 Plaquettes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Groupe sanguin *</label>
            <select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white" required>
              <option value="">Sélectionnez</option>
              <option value="A+">A+</option><option value="A-">A-</option>
              <option value="B+">B+</option><option value="B-">B-</option>
              <option value="AB+">AB+</option><option value="AB-">AB-</option>
              <option value="O+">O+</option><option value="O-">O-</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Wilaya *</label>
            <input type="text" placeholder="Ex: 16" value={form.wilaya} onChange={(e) => setForm({ ...form, wilaya: e.target.value })} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40" required />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Hôpital / Association</label>
            <input type="text" placeholder="Nom de l'établissement" value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Urgence</label>
            <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white">
              <option value="NORMAL">🟢 Normal</option>
              <option value="URGENT">🟡 Urgent</option>
              <option value="CRITICAL">🔴 Critique</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Description / Notes</label>
            <textarea rows={3} placeholder="Informations complémentaires..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 resize-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50">
            {loading ? "Création..." : "📢 Créer la demande"}
          </button>
        </form>
      </div>
    </div>
  );
}

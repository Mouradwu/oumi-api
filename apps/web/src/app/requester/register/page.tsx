"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { API_URL } from "@/lib/api";

const DRAFT_KEY = "requester_form_draft";

export default function RequesterRegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [wilayas, setWilayas] = useState<{ id: number; code: string; name_fr: string }[]>([]);
  const [form, setForm] = useState({
    blood_type: "",
    donation_type: "SANG",
    wilaya_id: "" as number | "",
    hospital_name: "",
    urgency_level: "normal",
    additional_info: "",
    contact_phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/wilayas`)
      .then((res) => res.json())
      .then((data) => setWilayas(Array.isArray(data) ? data : []))
      .catch(() => setWilayas([]));
  }, []);

  // Restaure un brouillon laisse avant une redirection vers la connexion
  // (ex: utilisateur non connecte qui avait deja rempli le formulaire).
  useEffect(() => {
    const draft = sessionStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        setForm(JSON.parse(draft));
      } catch {}
      sessionStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Sauvegarde ce qui a deja ete saisi avant de renvoyer vers la
      // connexion, et demande a revenir directement ici apres connexion -
      // aucune donnee saisie n'est perdue.
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      router.push("/auth/login?redirect=/requester/register");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);

  if (authLoading) {
    return <div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Chargement...</div>;
  }
  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");
      const requestId = data.id;

      // Alerte les donneurs compatibles (meme wilaya en priorite) - sans
      // cette etape, la demande est creee mais personne n'est prevenu.
      let notified = 0;
      try {
        const dres = await fetch(`${API_URL}/donors?blood_type=${encodeURIComponent(form.blood_type)}`);
        const donors = await dres.json();
        const donorsList = Array.isArray(donors) ? donors : [];
        const sameWilaya = donorsList.filter((d: any) => Number(d.wilaya_id) === Number(form.wilaya_id));
        const targets = (sameWilaya.length > 0 ? sameWilaya : donorsList).slice(0, 10);
        const requesterName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

        for (const d of targets) {
          if (!d.userId) continue;
          const nres = await fetch(`${API_URL}/notifications`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: JSON.stringify({
              userId: d.userId,
              title: form.urgency_level === "critical" ? "🔴 Demande urgente de sang" : "Demande de sang",
              body: `${requesterName} a besoin de ${form.blood_type} (${form.donation_type}).`,
              type: "request",
              data: { requestId, receiverId: user.id, receiverName: requesterName },
            }),
          });
          if (nres.ok) notified++;
        }
      } catch {
        // la demande reste creee meme si l'envoi des alertes echoue partiellement
      }

      setSuccess(true);
      // Ajoute le rôle "requester" à l'utilisateur (n'empêche pas la
      // redirection si ça échoue : la demande est déjà créée).
      try {
        await fetch(`${API_URL}/users/me/roles`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({ roles: Array.from(new Set([...(user.roles || []), "requester"])) }),
        });
      } catch {
        // non bloquant
      }
      setResultMessage(notified > 0 ? `Demande créée et ${notified} donneur(s) alerté(s).` : "Demande créée. Aucun donneur compatible trouvé pour le moment.");
      setTimeout(() => router.push("/profile"), 2500);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
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
        {success && <div className="bg-green-500/20 text-green-400 p-3 rounded-lg mt-4">✅ {resultMessage || "Demande créée !"}</div>}
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
            <select value={form.blood_type} onChange={(e) => setForm({ ...form, blood_type: e.target.value })} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white" required>
              <option value="">Sélectionnez</option>
              <option value="A+">A+</option><option value="A-">A-</option>
              <option value="B+">B+</option><option value="B-">B-</option>
              <option value="AB+">AB+</option><option value="AB-">AB-</option>
              <option value="O+">O+</option><option value="O-">O-</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Wilaya *</label>
            <select value={form.wilaya_id} onChange={(e) => setForm({ ...form, wilaya_id: e.target.value ? Number(e.target.value) : "" })} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white" required>
              <option value="">Sélectionnez une wilaya</option>
              {wilayas.map((w) => (
                <option key={w.id} value={w.id}>{w.code} - {w.name_fr}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Hôpital / Association</label>
            <input type="text" placeholder="Nom de l'établissement" value={form.hospital_name} onChange={(e) => setForm({ ...form, hospital_name: e.target.value })} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Téléphone de contact *</label>
            <input type="tel" placeholder="06/07XXXXXXXX" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40" required />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Urgence</label>
            <select value={form.urgency_level} onChange={(e) => setForm({ ...form, urgency_level: e.target.value })} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white">
              <option value="normal">🟢 Normal</option>
              <option value="important">🟡 Important</option>
              <option value="urgent">🟠 Urgent</option>
              <option value="critical">🔴 Critique</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Informations complémentaires</label>
            <textarea rows={3} placeholder="Service, contexte..." value={form.additional_info} onChange={(e) => setForm({ ...form, additional_info: e.target.value })} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 resize-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50">
            {loading ? "Création..." : "📢 Créer la demande"}
          </button>
        </form>
      </div>
    </div>
  );
}

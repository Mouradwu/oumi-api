"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { API_URL } from "@/lib/api";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function CreateRequestPage() {
  const [wilayas, setWilayas] = useState<any[]>([]);
  const [form, setForm] = useState({
    blood_type: "O+",
    donation_type: "Sang",
    wilaya_id: "",
    hospital_name: "",
    contact_phone: "",
    urgency_level: "normal",
    needed_date: "",
    additional_info: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/wilayas`).then((r) => r.json()).then(setWilayas).catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const token = localStorage.getItem("token") || localStorage.getItem("access_token") || localStorage.getItem("jwt");

    try {
      // 1. Créer la demande
      const res = await fetch(`${API_URL}/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          blood_type: form.blood_type,
          donation_type: form.donation_type,
          wilaya_id: Number(form.wilaya_id),
          hospital_name: form.hospital_name,
          contact_phone: form.contact_phone,
          urgency_level: form.urgency_level,
          needed_date: form.needed_date || null,
          additional_info: form.additional_info,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur création demande");
      }

      const created = await res.json();
      const requestId = created.id;

      // 2. Récupérer les donneurs de la même wilaya
      const dres = await fetch(`${API_URL}/donors`);
      const donors = await dres.json();
      const sameWilaya = donors.filter((d: any) => Number(d.wilaya_id) === Number(form.wilaya_id));
      const targets = (sameWilaya.length > 0 ? sameWilaya : donors).slice(0, 10);

      // 3. Envoyer notifications aux donneurs
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const requesterName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "Quelqu'un";

      let notified = 0;
      for (const d of targets) {
        if (!d.user?.id) continue;

        const nres = await fetch(`${API_URL}/notifications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: d.user.id,
            title: "Demande d'aide urgente",
            message: `${requesterName} a besoin de ${form.blood_type} (${form.donation_type}).`,
            type: "request",
            data: {
              requestId,
              receiverId: d.user.id,
              receiverName: d.user.first_name,
              blood_type: form.blood_type,
              donation_type: form.donation_type,
              wilaya_id: Number(form.wilaya_id),
            },
          }),
        });

        if (nres.ok) notified++;
      }

      setResult({
        ok: true,
        message: `Demande créée et ${notified} donneur(s) notifié(s).`,
      });
    } catch (err: any) {
      setResult({ ok: false, message: `Erreur : ${err.message}` });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white py-12 px-6">
      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Logo size={40} light />
          </Link>
          <h1 className="text-3xl font-bold mb-2">Demander de l'aide</h1>
          <p className="text-white/60">Votre demande sera envoyée aux donneurs compatibles</p>
        </div>

        {result && (
          <div
            className={`mb-6 p-4 rounded-xl border text-sm ${
              result.ok
                ? "border-green-500/30 bg-green-500/10"
                : "border-red-500/30 bg-red-500/10"
            }`}
          >
            {result.message}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4 bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Groupe sanguin</label>
              <select
                value={form.blood_type}
                onChange={(e) => setForm({ ...form, blood_type: e.target.value })}
                className="w-full px-4 py-3 bg-[#0f0f1a] border border-white/20 rounded-xl text-white"
              >
                {BLOOD_TYPES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Type de don</label>
              <select
                value={form.donation_type}
                onChange={(e) => setForm({ ...form, donation_type: e.target.value })}
                className="w-full px-4 py-3 bg-[#0f0f1a] border border-white/20 rounded-xl text-white"
              >
                <option value="Sang">Sang</option>
                <option value="Plasma">Plasma</option>
                <option value="Plaquettes">Plaquettes</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Wilaya</label>
              <select
                value={form.wilaya_id}
                onChange={(e) => setForm({ ...form, wilaya_id: e.target.value })}
                required
                className="w-full px-4 py-3 bg-[#0f0f1a] border border-white/20 rounded-xl text-white"
              >
                <option value="">Sélectionnez</option>
                {wilayas.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {w.name_fr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Urgence</label>
              <select
                value={form.urgency_level}
                onChange={(e) => setForm({ ...form, urgency_level: e.target.value })}
                className="w-full px-4 py-3 bg-[#0f0f1a] border border-white/20 rounded-xl text-white"
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critique</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Hôpital / lieu</label>
            <input
              type="text"
              value={form.hospital_name}
              onChange={(e) => setForm({ ...form, hospital_name: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
              placeholder="CHU Mustapha..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Téléphone de contact</label>
              <input
                type="tel"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                placeholder="0550123456"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Date souhaitée</label>
              <input
                type="date"
                value={form.needed_date}
                onChange={(e) => setForm({ ...form, needed_date: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Informations complémentaires</label>
            <textarea
              value={form.additional_info}
              onChange={(e) => setForm({ ...form, additional_info: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90 disabled:opacity-50"
          >
            {loading ? "Envoi..." : "Envoyer la demande"}
          </button>
        </form>
      </div>
    </div>
  );
}
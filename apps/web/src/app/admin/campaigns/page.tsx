"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const STATUS_LABEL: Record<string, { color: string; label: string }> = {
  draft: { color: "bg-mist text-slate", label: "Brouillon" },
  active: { color: "bg-recovery-light text-recovery-dark", label: "Active" },
  inactive: { color: "bg-amber-light text-amber", label: "Inactive" },
  ended: { color: "bg-mist text-slate", label: "Terminée" },
};

const emptyForm = {
  name: "", description: "", practical_info: "", image_url: "",
  start_date: "", end_date: "", hours_label: "", wilaya_id: "" as number | "",
  location: "", blood_types_needed: [] as string[], contact_phone: "", contact_name: "",
  action_label: "Prendre rendez-vous",
};

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export default function AdminCampaignsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [wilayas, setWilayas] = useState<{ id: number; name_fr: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = (user?.roles || []).includes("admin");

  const load = async () => {
    const token = getToken();
    try {
      const [cRes, wRes] = await Promise.all([
        fetch(`${API_URL}/campaigns/admin/all`, { headers: { Authorization: "Bearer " + token } }),
        fetch(`${API_URL}/wilayas`),
      ]);
      if (cRes.ok) setCampaigns(await cRes.json());
      if (wRes.ok) setWilayas(await wRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    if (!isAdmin) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const toggleBloodType = (bt: string) => {
    setForm((p) => ({
      ...p,
      blood_types_needed: p.blood_types_needed.includes(bt) ? p.blood_types_needed.filter((x) => x !== bt) : [...p.blood_types_needed, bt],
    }));
  };

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
  const openEdit = (c: any) => {
    setForm({
      name: c.name || "", description: c.description || "", practical_info: c.practical_info || "",
      image_url: c.image_url || "", start_date: c.start_date?.slice(0, 16) || "", end_date: c.end_date?.slice(0, 16) || "",
      hours_label: c.hours_label || "", wilaya_id: c.wilaya_id || "", location: c.location || "",
      blood_types_needed: c.blood_types_needed || [], contact_phone: c.contact_phone || "",
      contact_name: c.contact_name || "", action_label: c.action_label || "Prendre rendez-vous",
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.start_date) { setError("Titre et date de début sont obligatoires."); return; }
    setSaving(true);
    setError("");
    const token = getToken();
    const payload = { ...form, wilaya_id: form.wilaya_id || null };
    try {
      const res = await fetch(editingId ? `${API_URL}/campaigns/${editingId}` : `${API_URL}/campaigns`, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Erreur");
      setShowForm(false);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const publish = async (id: string) => {
    const token = getToken();
    await fetch(`${API_URL}/campaigns/${id}/publish`, { method: "PATCH", headers: { Authorization: "Bearer " + token } });
    load();
  };
  const setStatus = async (id: string, status: string) => {
    const token = getToken();
    await fetch(`${API_URL}/campaigns/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ status }),
    });
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Supprimer définitivement cette campagne ?")) return;
    const token = getToken();
    await fetch(`${API_URL}/campaigns/${id}`, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
    load();
  };

  if (authLoading || loading) return <div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Chargement...</div>;
  if (!isAdmin) return <div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Accès réservé aux administrateurs.</div>;

  return (
    <ErrorBoundary fallbackTitle="Erreur d'affichage de l'administration">
    <div className="min-h-screen bg-paper text-ink">
      <Header />
      <main className="container mx-auto px-5 md:px-6 py-8 max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-display text-2xl font-bold text-ink">Administration — Campagnes</h1>
          <button onClick={openCreate} className="px-4 py-2 bg-vital text-white text-sm rounded-full font-medium hover:bg-vital-dark transition-colors">
            + Nouvelle campagne
          </button>
        </div>

        {showForm && (
          <div className="bg-surface rounded-2xl border border-line p-5 mb-6 space-y-3">
            <h2 className="font-semibold text-ink mb-2">{editingId ? "Modifier la campagne" : "Nouvelle campagne"}</h2>
            {error && <div className="bg-vital-light text-vital-dark p-3 rounded-xl text-sm">{error}</div>}
            <input placeholder="Titre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full p-2.5 border border-line rounded-lg text-sm" />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full p-2.5 border border-line rounded-lg text-sm resize-none" />
            <textarea placeholder="Informations pratiques" value={form.practical_info} onChange={(e) => setForm({ ...form, practical_info: e.target.value })} rows={2} className="w-full p-2.5 border border-line rounded-lg text-sm resize-none" />
            <input placeholder="URL de l'image" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full p-2.5 border border-line rounded-lg text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate">Date de début *</label>
                <input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full p-2.5 border border-line rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate">Date de fin</label>
                <input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full p-2.5 border border-line rounded-lg text-sm" />
              </div>
            </div>
            <input placeholder="Horaires (ex: 9h-17h)" value={form.hours_label} onChange={(e) => setForm({ ...form, hours_label: e.target.value })} className="w-full p-2.5 border border-line rounded-lg text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.wilaya_id} onChange={(e) => setForm({ ...form, wilaya_id: e.target.value ? Number(e.target.value) : "" })} className="w-full p-2.5 border border-line rounded-lg text-sm">
                <option value="">Wilaya</option>
                {wilayas.map((w) => <option key={w.id} value={w.id}>{w.name_fr}</option>)}
              </select>
              <input placeholder="Lieu précis" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full p-2.5 border border-line rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate block mb-1">Groupes sanguins recherchés</label>
              <div className="flex flex-wrap gap-1.5">
                {BLOOD_TYPES.map((bt) => (
                  <button key={bt} type="button" onClick={() => toggleBloodType(bt)} className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${form.blood_types_needed.includes(bt) ? "bg-vital text-white" : "bg-mist text-slate"}`}>
                    {bt}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Téléphone de contact" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="w-full p-2.5 border border-line rounded-lg text-sm" />
              <input placeholder="Nom du contact" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="w-full p-2.5 border border-line rounded-lg text-sm" />
            </div>
            <input placeholder="Texte du bouton d'action" value={form.action_label} onChange={(e) => setForm({ ...form, action_label: e.target.value })} className="w-full p-2.5 border border-line rounded-lg text-sm" />
            <div className="flex gap-2 pt-2">
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-brand text-white text-sm rounded-full font-medium hover:bg-brand-dark transition-colors disabled:opacity-50">
                {saving ? "..." : editingId ? "Enregistrer" : "Créer (brouillon)"}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-mist text-ink text-sm rounded-full font-medium hover:bg-line transition-colors">
                Annuler
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {campaigns.map((c) => {
            const s = STATUS_LABEL[c.status] || STATUS_LABEL.draft;
            return (
              <div key={c.id} className="bg-surface rounded-2xl border border-line p-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-semibold text-ink text-sm">{c.name}</h3>
                    <p className="text-xs text-slate mt-0.5">{new Date(c.start_date).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.color}`}>{s.label}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button onClick={() => openEdit(c)} className="text-xs px-3 py-1.5 bg-mist text-ink rounded-full hover:bg-line transition-colors">Modifier</button>
                  {c.status === "draft" && (
                    <button onClick={() => publish(c.id)} className="text-xs px-3 py-1.5 bg-brand text-white rounded-full hover:bg-brand-dark transition-colors">Publier</button>
                  )}
                  {c.status === "active" && (
                    <button onClick={() => setStatus(c.id, "inactive")} className="text-xs px-3 py-1.5 bg-amber-light text-amber rounded-full">Désactiver</button>
                  )}
                  {c.status === "inactive" && (
                    <button onClick={() => setStatus(c.id, "active")} className="text-xs px-3 py-1.5 bg-recovery-light text-recovery-dark rounded-full">Réactiver</button>
                  )}
                  <button onClick={() => remove(c.id)} className="text-xs px-3 py-1.5 text-vital hover:bg-vital-light rounded-full transition-colors">Supprimer</button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
    </ErrorBoundary>
  );
}

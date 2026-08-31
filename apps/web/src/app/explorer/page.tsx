"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

interface Donor {
  id: number;
  blood_group: string;
  donation_types: string[];
  wilaya: string;
  availability: boolean;
  certified: boolean;
  user: { first_name: string; last_name: string; };
}

interface Request {
  id: number;
  blood_group: string;
  donation_type: string;
  wilaya: string;
  hospital: string;
  urgency: string;
  description: string;
  user: { first_name: string; last_name: string; };
}

export default function ExplorerPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'donors' | 'requests'>('donors');
  const [donors, setDonors] = useState<Donor[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [filters, setFilters] = useState({ blood_group: "", donation_type: "", wilaya: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dRes, rRes] = await Promise.all([
          fetch("https://oumiapi-production.up.railway.app/donors"),
          fetch("https://oumiapi-production.up.railway.app/requests")
        ]);
        const dData = await dRes.json();
        const rData = await rRes.json();
        setDonors(Array.isArray(dData) ? dData : []);
        setRequests(Array.isArray(rData) ? rData : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRequestHelp = async (donorId: number, donorName: string) => {
    if (!user) { alert("Connectez-vous"); return; }
    setActionLoading(donorId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://oumiapi-production.up.railway.app/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          userId: donorId,
          title: "Demande d'aide",
          message: `${user.first_name} ${user.last_name} a besoin de votre aide.`,
          type: "request",
          data: { receiverId: user.id, receiverName: user.first_name + " " + user.last_name },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("✅ Demande envoyée");
    } catch (err) {
      alert("Erreur : " + (err as any).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOfferHelp = async (requestId: number, requesterId: string) => {
    if (!user) { alert("Connectez-vous"); return; }
    setActionLoading(requestId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://oumiapi-production.up.railway.app/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          userId: requesterId,
          title: "Offre d'aide",
          message: `${user.first_name} ${user.last_name} peut vous aider pour votre demande.`,
          type: "offer",
          data: { donorId: user.id, donorName: user.first_name + " " + user.last_name },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("✅ Offre envoyée");
    } catch (err) {
      alert("Erreur : " + (err as any).message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredDonors = donors.filter(d => {
    if (filters.blood_group && d.blood_group !== filters.blood_group) return false;
    if (filters.donation_type && !d.donation_types.includes(filters.donation_type)) return false;
    if (filters.wilaya && d.wilaya !== filters.wilaya) return false;
    return true;
  });

  const filteredRequests = requests.filter(r => {
    if (filters.blood_group && r.blood_group !== filters.blood_group) return false;
    if (filters.donation_type && r.donation_type !== filters.donation_type) return false;
    if (filters.wilaya && r.wilaya !== filters.wilaya) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-white/5 backdrop-blur-xl bg-black/20 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/"><Logo size={28} /></Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm text-white/70 hover:text-white">Accueil</Link>
            <Link href="/explorer" className="text-sm text-white/70 hover:text-white font-semibold text-red-400">Explorer</Link>
            <Link href="/profile" className="text-sm text-white/70 hover:text-white">Profil</Link>
            <Link href="/notifications" className="text-sm text-white/70 hover:text-white">🔔</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">🔍 Explorer</h1>
        <div className="flex gap-4 mb-6">
          <button onClick={() => setTab('donors')} className={`px-6 py-2 rounded-lg transition ${tab === 'donors' ? 'bg-red-600' : 'bg-white/10'}`}>❤️ Donneurs</button>
          <button onClick={() => setTab('requests')} className={`px-6 py-2 rounded-lg transition ${tab === 'requests' ? 'bg-red-600' : 'bg-white/10'}`}>🚨 Demandes</button>
        </div>

        <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={filters.blood_group} onChange={(e) => setFilters({ ...filters, blood_group: e.target.value })} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white">
              <option value="">Tous groupes</option>
              <option value="A+">A+</option><option value="A-">A-</option>
              <option value="B+">B+</option><option value="B-">B-</option>
              <option value="AB+">AB+</option><option value="AB-">AB-</option>
              <option value="O+">O+</option><option value="O-">O-</option>
            </select>
            <select value={filters.donation_type} onChange={(e) => setFilters({ ...filters, donation_type: e.target.value })} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white">
              <option value="">Tous types</option>
              <option value="SANG">🩸 Sang</option>
              <option value="PLASMA">💧 Plasma</option>
              <option value="PLAQUETTES">🧬 Plaquettes</option>
            </select>
            <input type="text" placeholder="Wilaya" value={filters.wilaya} onChange={(e) => setFilters({ ...filters, wilaya: e.target.value })} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40" />
          </div>
        </div>

        {loading && <div className="text-center py-12 text-white/50">Chargement...</div>}

        {tab === 'donors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDonors.map((donor) => (
              <div key={donor.id} className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-red-500/30 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{donor.user?.first_name} {donor.user?.last_name}</h3>
                    <p className="text-sm text-white/60">🩸 {donor.blood_group} - {donor.donation_types.join(", ")}</p>
                    <p className="text-sm text-white/40">📍 Wilaya {donor.wilaya}</p>
                    {donor.availability && <span className="text-green-400 text-sm">🟢 Disponible</span>}
                  </div>
                </div>
                <button onClick={() => handleRequestHelp(donor.id, donor.user.first_name)} disabled={actionLoading === donor.id} className="mt-3 w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition disabled:opacity-50">
                  {actionLoading === donor.id ? "..." : "🤝 Demander de l'aide"}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'requests' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((req) => (
              <div key={req.id} className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-red-500/30 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{req.donation_type} - {req.blood_group}</p>
                    <p className="text-sm text-white/60">🏥 {req.hospital || "Établissement"}</p>
                    <p className="text-sm text-white/40">📍 Wilaya {req.wilaya}</p>
                    <span className={`text-xs px-2 py-1 rounded ${req.urgency === 'CRITICAL' ? 'bg-red-600/20 text-red-400' : req.urgency === 'URGENT' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-green-600/20 text-green-400'}`}>{req.urgency}</span>
                  </div>
                </div>
                {user && user.id !== req.userId && (
                  <button onClick={() => handleOfferHelp(req.id, req.userId)} disabled={actionLoading === req.id} className="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition disabled:opacity-50">
                    {actionLoading === req.id ? "..." : "💪 Je peux aider"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


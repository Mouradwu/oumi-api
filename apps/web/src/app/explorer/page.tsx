"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import { toArray } from "@/lib/safe";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BottomNav } from "@/components/BottomNav";

interface Donor {
  id: string;
  userId: string;
  blood_type: string;
  donation_types: string[];
  wilaya_id: number;
  availability_status: string;
  certified: boolean;
  user: { first_name: string; last_name: string };
}

interface DonationRequest {
  id: string;
  blood_type: string;
  donation_type: string;
  wilaya_id: number;
  hospital_name: string | null;
  urgency_level: string;
  additional_info: string | null;
  requester: { id: string; first_name: string; last_name: string };
}

export default function ExplorerPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'donors' | 'requests'>('donors');
  const [donors, setDonors] = useState<Donor[]>([]);
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [wilayas, setWilayas] = useState<{ id: number; code: string; name_fr: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState({ blood_type: "", donation_type: "", wilaya_id: "" as number | "" });
  const [searchTriggered, setSearchTriggered] = useState(false);

  const wilayaName = (id: number) => wilayas.find((w) => w.id === id)?.name_fr || `#${id}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dRes, rRes, wRes] = await Promise.all([
          fetch(`${API_URL}/donors`),
          fetch(`${API_URL}/requests`),
          fetch(`${API_URL}/wilayas`),
        ]);
        const dData = await dRes.json();
        const rData = await rRes.json();
        const wData = await wRes.json();
        setDonors(Array.isArray(dData) ? dData : []);
        setRequests(Array.isArray(rData) ? rData : []);
        setWilayas(Array.isArray(wData) ? wData : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = () => { setSearchTriggered(true); };

  const handleRequestHelp = async (donorUserId: string, donorName: string) => {
    if (!user) { alert("Connectez-vous"); return; }
    setActionLoading(donorUserId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          userId: donorUserId,
          title: "Demande d'aide",
          body: `${user.first_name} ${user.last_name} a besoin de votre aide.`,
          type: "request",
          data: { receiverId: user.id, receiverName: user.first_name + " " + user.last_name },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("✅ Demande envoyée");
    } catch (err: any) {
      alert("Erreur : " + (err.message || "Inconnue"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleOfferHelp = async (requestId: string, requesterId: string) => {
    if (!user) { alert("Connectez-vous"); return; }
    setActionLoading(requestId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          userId: requesterId,
          title: "Offre d'aide",
          body: `${user.first_name} ${user.last_name} peut vous aider pour votre demande.`,
          type: "offer",
          data: { requestId, donorId: user.id, donorName: user.first_name + " " + user.last_name },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("✅ Offre envoyée");
    } catch (err: any) {
      alert("Erreur : " + (err.message || "Inconnue"));
    } finally {
      setActionLoading(null);
    }
  };

  const filteredDonors = searchTriggered ? donors.filter(d => {
    if (filters.blood_type && d.blood_type !== filters.blood_type) return false;
    if (filters.donation_type && !toArray(d.donation_types).includes(filters.donation_type)) return false;
    if (filters.wilaya_id && d.wilaya_id !== filters.wilaya_id) return false;
    return true;
  }) : [];

  const filteredRequests = searchTriggered ? requests.filter(r => {
    if (filters.blood_type && r.blood_type !== filters.blood_type) return false;
    if (filters.donation_type && r.donation_type !== filters.donation_type) return false;
    if (filters.wilaya_id && r.wilaya_id !== filters.wilaya_id) return false;
    return true;
  }) : [];

  const urgencyStyle = (level: string) => {
    if (level === 'critical') return 'bg-vital-light text-vital-dark';
    if (level === 'urgent') return 'bg-amber-light text-amber';
    if (level === 'important') return 'bg-amber-light text-amber';
    return 'bg-recovery-light text-recovery-dark';
  };

  return (
    <ErrorBoundary fallbackTitle="Erreur d'affichage de l'explorateur">
    <div className="min-h-screen bg-paper text-ink pb-safe-nav">
      <Header />
      <main className="container mx-auto px-5 md:px-6 py-8 max-w-4xl">
        <h1 className="font-display text-2xl font-bold mb-6 text-ink">Explorer</h1>
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('donors')} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors border ${tab === 'donors' ? 'bg-vital border-vital text-white' : 'bg-surface border-line text-ink hover:border-slate'}`}>Donneurs</button>
          <button onClick={() => setTab('requests')} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors border ${tab === 'requests' ? 'bg-vital border-vital text-white' : 'bg-surface border-line text-ink hover:border-slate'}`}>Demandes</button>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-line mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={filters.blood_type} onChange={(e) => setFilters({ ...filters, blood_type: e.target.value })} className="p-2.5 bg-paper border border-line rounded-lg text-ink text-sm">
              <option value="">Tous groupes</option>
              <option value="A+">A+</option><option value="A-">A-</option>
              <option value="B+">B+</option><option value="B-">B-</option>
              <option value="AB+">AB+</option><option value="AB-">AB-</option>
              <option value="O+">O+</option><option value="O-">O-</option>
            </select>
            <select value={filters.donation_type} onChange={(e) => setFilters({ ...filters, donation_type: e.target.value })} className="p-2.5 bg-paper border border-line rounded-lg text-ink text-sm">
              <option value="">Tous types</option>
              <option value="SANG">Sang</option>
              <option value="PLASMA">Plasma</option>
              <option value="PLAQUETTES">Plaquettes</option>
            </select>
            <select value={filters.wilaya_id} onChange={(e) => setFilters({ ...filters, wilaya_id: e.target.value ? Number(e.target.value) : "" })} className="p-2.5 bg-paper border border-line rounded-lg text-ink text-sm">
              <option value="">Toutes wilayas</option>
              {wilayas.map((w) => (
                <option key={w.id} value={w.id}>{w.code} - {w.name_fr}</option>
              ))}
            </select>
          </div>
          <button onClick={handleSearch} className="mt-4 px-6 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-full transition-colors">Rechercher</button>
        </div>

        {loading && <div className="text-center py-12 text-slate text-sm">Chargement...</div>}

        {tab === 'donors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDonors.length === 0 && searchTriggered ? (
              <div className="col-span-full text-center py-12 text-slate text-sm">Aucun donneur trouvé.</div>
            ) : (
              filteredDonors.map((donor) => (
                <div key={donor.id} className="bg-surface p-4 rounded-2xl border border-line hover:border-brand/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-ink text-sm">{donor.user?.first_name} {donor.user?.last_name}</h3>
                      <p className="text-sm text-slate mt-0.5">{donor.blood_type} · {toArray(donor.donation_types).join(", ")}</p>
                      <p className="text-xs text-slate mt-0.5">{wilayaName(donor.wilaya_id)}</p>
                      {donor.availability_status === 'green' && <span className="inline-block mt-1.5 text-xs px-2 py-0.5 bg-recovery-light text-recovery-dark rounded-full font-medium">Disponible</span>}
                    </div>
                  </div>
                  <button onClick={() => handleRequestHelp(donor.userId, donor.user.first_name)} disabled={actionLoading === donor.userId} className="mt-3 w-full px-4 py-2 bg-vital hover:bg-vital-dark text-white rounded-full text-sm font-medium transition-colors disabled:opacity-50">
                    {actionLoading === donor.userId ? "..." : "Demander de l'aide"}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'requests' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.length === 0 && searchTriggered ? (
              <div className="col-span-full text-center py-12 text-slate text-sm">Aucune demande trouvée.</div>
            ) : (
              filteredRequests.map((request) => (
                <div key={request.id} className="bg-surface p-4 rounded-2xl border border-line hover:border-brand/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-ink text-sm">{request.donation_type} · {request.blood_type}</p>
                      <p className="text-sm text-slate mt-0.5">{request.hospital_name || "Établissement non précisé"}</p>
                      <p className="text-xs text-slate mt-0.5">{wilayaName(request.wilaya_id)}</p>
                      <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${urgencyStyle(request.urgency_level)}`}>{request.urgency_level}</span>
                    </div>
                  </div>
                  {user && user.id !== request.requester?.id && (
                    <button onClick={() => handleOfferHelp(request.id, request.requester.id)} disabled={actionLoading === request.id} className="mt-3 w-full px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-full text-sm font-medium transition-colors disabled:opacity-50">
                      {actionLoading === request.id ? "..." : "Je peux aider"}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
    </ErrorBoundary>
  );
}

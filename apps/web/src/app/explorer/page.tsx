"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";

interface Donor {
  id: number;
  blood_group: string;
  donation_types: string[];
  wilaya: string;
  availability: boolean;
  certified: boolean;
  has_donated_before: boolean;
  last_donation_date: string;
  user: {
    first_name: string;
    last_name: string;
  };
}

export default function ExplorerPage() {
  const { user } = useAuth();
  const { user } = useAuth();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [filtered, setFiltered] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Filtres
  const [bloodGroup, setBloodGroup] = useState("");
  const [donationType, setDonationType] = useState("");
  const [wilaya, setWilaya] = useState("");
    const [radius, setRadius] = useState(50);
  const [requesting, setRequesting] = useState<number | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  const handleRequestHelp = async (donorId: number, donorName: string) => {
    if (!user) {
      alert("Veuillez vous connecter pour faire une demande.");
      return;
    }
    setRequesting(donorId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://oumiapi-production.up.railway.app/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          userId: donorId, // le donneur
          title: "Demande d'aide",
          message: `${user.first_name} ${user.last_name} a besoin de votre aide pour un don.`,
          type: "request",
          data: { receiverId: user.id, receiverName: user.first_name + " " + user.last_name },
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de l'envoi");
      setRequestSuccess(`✅ Demande envoyée à ${donorName}`);
      setTimeout(() => setRequestSuccess(null), 5000);
    } catch (err: any) {
      alert("Erreur : " + err.message);
    } finally {
      setRequesting(null);
    }
  };

  useEffect(() => {
    fetch("https://oumiapi-production.up.railway.app/donors")
      .then((res) => res.json())
      .then((data) => {
        setDonors(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setDonors([]);
        setLoading(false);
      });
  }, []);

  const handleSearch = () => {
    setSearching(true);
    let results = donors;

    if (bloodGroup) {
      results = results.filter((d) => d.blood_group === bloodGroup);
    }
    if (donationType) {
      results = results.filter((d) => d.donation_types.includes(donationType));
    }
    if (wilaya) {
      results = results.filter((d) => d.wilaya === wilaya);
    }
    // Ici, on pourrait filtrer par rayon si on avait les coordonnées GPS
    // Pour l'instant, on simule un rayon en prenant les premiers résultats

    setFiltered(results);
    setSearching(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-white/5 backdrop-blur-xl bg-black/20 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/"><Logo size={28} /></Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm text-white/70 hover:text-white">Accueil</Link>
            <Link href="/wilayas" className="text-sm text-white/70 hover:text-white">Wilayas</Link>
            <Link href="/explorer" className="text-sm text-white/70 hover:text-white font-semibold text-red-400">Explorer</Link>
            {user ? (
              <Link href="/donor/profile" className="text-sm text-white/70 hover:text-white">Profil</Link>
            ) : (
              <Link href="/auth/login" className="text-sm text-white/70 hover:text-white">Connexion</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">🔍 Explorer les donneurs</h1>

        <div className="bg-white/5 p-6 rounded-xl border border-white/10 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Groupe sanguin</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="">Tous</option>
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
              <label className="block text-sm text-white/60 mb-1">Type de don</label>
              <select
                value={donationType}
                onChange={(e) => setDonationType(e.target.value)}
                className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="">Tous</option>
                <option value="SANG">🩸 Sang</option>
                <option value="PLASMA">💧 Plasma</option>
                <option value="PLAQUETTES">🧬 Plaquettes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Wilaya</label>
              <input
                type="text"
                placeholder="Ex: 16"
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Rayon (km)</label>
              <input
                type="number"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white"
                min="5"
                max="500"
              />
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
          >
            {searching ? "Recherche..." : "🔍 Rechercher"}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-white/50">Chargement des donneurs...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-white/50">Aucun donneur trouvé avec ces critères.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((donor) => (
              <div key={donor.id} className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-red-500/30 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{donor.user?.first_name} {donor.user?.last_name}</h3>
                    <p className="text-sm text-white/60">🩸 {donor.blood_group}</p>
                    <p className="text-sm text-white/60">{donor.donation_types.join(", ")}</p>
                    <p className="text-sm text-white/40">📍 Wilaya {donor.wilaya}</p>
                  </div>
                  <div className="text-right">
                    {donor.availability && <span className="text-green-400 text-sm">🟢 Disponible</span>}
                    {donor.certified && <span className="block text-blue-400 text-xs">✅ Certifié</span>}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  {user ? (
                    <button className="px-3 py-1 bg-red-600/20 text-red-400 text-sm rounded hover:bg-red-600/30 transition">
                      🤝 Demander de l'aide
                    </button>
                  ) : (
                    <Link href="/auth/login" className="px-3 py-1 bg-white/10 text-white text-sm rounded hover:bg-white/20 transition">
                      🔒 Connectez-vous
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


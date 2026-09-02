"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  body: string;
  message: string;
  type: string;
  is_read: boolean;
  data: any;
  created_at: string;
}

interface DonationRequest {
  id: string;
  blood_type: string;
  donation_type: string;
  wilaya_id: number;
  hospital_name: string | null;
  urgency_level: string;
  requester: { id: string };
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [donorProfile, setDonorProfile] = useState<any>(null);
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Vérification du token (une seule fois)
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    if (!user) {
      // Si user n'est pas encore chargé, on attend
      return;
    }

    const fetchAll = async () => {
      try {
        const [nRes, dRes, rRes] = await Promise.all([
          fetch(`${API_URL}/notifications?userId=${user.id}`, {
            headers: { Authorization: "Bearer " + token },
          }),
          fetch(`${API_URL}/donors/me?userId=${user.id}`, {
            headers: { Authorization: "Bearer " + token },
          }),
          fetch(`${API_URL}/requests?userId=${user.id}`, {
            headers: { Authorization: "Bearer " + token },
          })
        ]);
        if (nRes.ok) {
          const nData = await nRes.json();
          setNotifications(Array.isArray(nData) ? nData : []);
        }
        if (dRes.ok && dRes.status !== 404) {
          const dData = await dRes.json();
          setDonorProfile(dData);
        }
        if (rRes.ok) {
          const rData = await rRes.json();
          setRequests(Array.isArray(rData) ? rData : []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user, router]);

  useEffect(() => {
    if (user && typeof user.is_active === "boolean") {
      setIsPaused(!user.is_active);
    }
  }, [user]);

  const toggleAvailability = async () => {
    const token = localStorage.getItem("token");
    if (!donorProfile) return;
    try {
      const res = await fetch(`${API_URL}/donors/${donorProfile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ availability_status: donorProfile.availability_status === "green" ? "red" : "green" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDonorProfile(updated);
        alert("Disponibilité mise à jour !");
      } else {
        throw new Error("Erreur");
      }
    } catch (e) {
      alert("Erreur lors de la mise à jour");
    }
  };

  const togglePause = async () => {
    const token = localStorage.getItem("token");
    const newState = !isPaused;
    try {
      const res = await fetch(`${API_URL}/users/me/active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ is_active: !newState }),
      });
      if (!res.ok) throw new Error();
      setIsPaused(newState);
    } catch {
      alert("Erreur lors de la mise à jour du statut du compte");
    }
  };

  const deleteAccount = async () => {
    if (!confirm("Supprimer définitivement votre compte ? Toutes vos données (profil donneur, demandes, notifications) seront effacées. Cette action est irréversible.")) return;
    if (!confirm("Dernière confirmation : êtes-vous certain de vouloir supprimer votre compte ?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error();
      logout();
    } catch {
      alert("Erreur lors de la suppression du compte");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">Chargement...</div>;
  if (!user) return null;

  const roles = user.roles || [];
  const isDonor = roles.includes("donor") || donorProfile !== null;
  const isRequester = roles.includes("requester") || requests.some(r => r.requester?.id === user.id);
  const acceptedNotifications = notifications.filter(n => n.type === "acceptance");

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-white/5 backdrop-blur-xl bg-black/20 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/"><Logo size={28} /></Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm text-white/70 hover:text-white">Accueil</Link>
            <Link href="/explorer" className="text-sm text-white/70 hover:text-white">Explorer</Link>
            <Link href="/profile" className="text-sm text-white/70 hover:text-white font-semibold text-red-400">Profil</Link>
            <Link href="/notifications" className="text-sm text-white/70 hover:text-white">🔔</Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/60">Bonjour {user.first_name}</span>
            <button onClick={logout} className="text-sm text-red-400 hover:text-red-300 transition">Déconnexion</button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h1 className="text-2xl font-bold mb-4">👤 Mon profil</h1>
              <div className="space-y-3">
                <div><span className="text-white/40 text-sm">Prénom</span><p className="text-lg">{user.first_name}</p></div>
                <div><span className="text-white/40 text-sm">Nom</span><p className="text-lg">{user.last_name}</p></div>
                <div><span className="text-white/40 text-sm">Email</span><p className="text-lg">{user.email}</p></div>
                <div><span className="text-white/40 text-sm">Téléphone</span><p className="text-lg">{user.phone || "Non renseigné"}</p></div>
              </div>
              <hr className="border-white/10 my-4" />
              <h2 className="text-lg font-semibold mb-3">Mes rôles</h2>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => router.push("/donor/register")} className={`px-4 py-2 rounded-full text-sm transition ${isDonor ? "bg-red-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>
                  ❤️ Donneur {isDonor ? "✓" : "(activer)"}
                </button>
                <button onClick={() => router.push("/requester/register")} className={`px-4 py-2 rounded-full text-sm transition ${isRequester ? "bg-blue-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>
                  🩸 Demandeur {isRequester ? "✓" : "(activer)"}
                </button>
              </div>
              {isDonor && (
                <div className="mt-4">
                  <button onClick={toggleAvailability} className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition">
                    {donorProfile?.availability_status === "green" ? "🟢 Disponible (cliquer pour désactiver)" : "🔴 Indisponible (cliquer pour activer)"}
                  </button>
                  <Link href="/donor/update" className="w-full block text-center mt-2 px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition">
                    ✏️ Modifier mon profil donneur
                  </Link>
                </div>
              )}
              <hr className="border-white/10 my-4" />
              <div className="space-y-2">
                <button onClick={togglePause} className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition">
                  {isPaused ? "▶️ Réactiver mon compte" : "⏸️ Mettre en pause mon compte"}
                </button>
                <button onClick={deleteAccount} className="w-full px-4 py-2 bg-red-950/50 hover:bg-red-950 text-red-400 rounded-lg text-sm transition">
                  🗑️ Supprimer mon compte
                </button>
              </div>
            </div>
          </div>

          <div className="md:w-2/3 space-y-6">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h2 className="text-xl font-semibold mb-4">📋 Mes activités</h2>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/explorer?tab=donors" className="p-4 border border-white/5 rounded-lg hover:border-red-500/30 transition text-center">🔍 Explorer les donneurs</Link>
                <Link href="/explorer?tab=requests" className="p-4 border border-white/5 rounded-lg hover:border-red-500/30 transition text-center">🚨 Explorer les demandes</Link>
                <Link href="/donor/register" className="p-4 border border-white/5 rounded-lg hover:border-red-500/30 transition text-center">❤️ Devenir donneur</Link>
                <Link href="/requester/register" className="p-4 border border-white/5 rounded-lg hover:border-red-500/30 transition text-center">🩸 Devenir demandeur</Link>
                <Link href="/notifications" className="p-4 border border-white/5 rounded-lg hover:border-red-500/30 transition text-center">🔔 Notifications</Link>
              </div>
            </div>

            {requests.length > 0 && (
              <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <h2 className="text-xl font-semibold mb-4">📝 Mes demandes</h2>
                <div className="space-y-2">
                  {requests.slice(0, 5).map((req) => (
                    <div key={req.id} className="flex justify-between items-center border-b border-white/5 py-2">
                      <span>{req.blood_type} - {req.donation_type}</span>
                      <span className="text-sm text-white/40">{req.urgency_level || "normal"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {acceptedNotifications.length > 0 && (
              <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <h2 className="text-xl font-semibold mb-4">✅ Demandes acceptées (historique)</h2>
                <div className="space-y-2">
                  {acceptedNotifications.map((n) => (
                    <div key={n.id} className="flex justify-between items-center border-b border-white/5 py-2">
                      <span className="text-sm">{n.body || n.message}</span>
                      <span className="text-xs text-white/30">{new Date(n.created_at).toLocaleDateString()}</span>
                      {n.data?.donorPhone && (
                        <span className="text-green-400 text-sm">📞 {n.data.donorPhone}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

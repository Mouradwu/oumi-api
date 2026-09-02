"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { BloodDrop } from "@/components/BloodDrop";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { API_URL } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface DonationRequest {
  id: string;
  blood_type: string;
  donation_type: string;
  status: string;
  requester: { id: string };
}

interface Dashboard {
  donor: any;
  donation_count: number;
  current_tier: string | null;
  next_tier: { name: string; remaining: number; threshold: number } | null;
  next_eligible_date: string | null;
  eligible_now: boolean;
  impact_count: number;
}

const TIER_STYLE: Record<string, { bg: string; icon: string }> = {
  Bronze: { bg: "#E8C39E", icon: "#8A5A2B" },
  Argent: { bg: "#DCE1E8", icon: "#5B6472" },
  Or: { bg: "#F3D68A", icon: "#8A6412" },
};

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const load = async () => {
    if (!user) return;
    const token = getToken();
    try {
      const [dashRes, rRes] = await Promise.all([
        fetch(`${API_URL}/donors/dashboard?userId=${user.id}`),
        fetch(`${API_URL}/requests?userId=${user.id}`, { headers: { Authorization: "Bearer " + token } }),
      ]);
      if (dashRes.ok) setDashboard(await dashRes.json());
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

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  useEffect(() => {
    if (user && typeof user.is_active === "boolean") setIsPaused(!user.is_active);
  }, [user]);

  const isDonor = !!dashboard?.donor;
  const isRequester = requests.some((r) => r.requester?.id === user?.id);
  const activeRequests = requests.filter((r) => ["pending", "accepted", "donation_declared"].includes(r.status));

  const toggleAvailability = async () => {
    const token = getToken();
    if (!dashboard?.donor) return;
    try {
      const res = await fetch(`${API_URL}/donors/${dashboard.donor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ availability_status: dashboard.donor.availability_status === "green" ? "red" : "green" }),
      });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      alert("Erreur lors de la mise à jour");
    }
  };

  const confirmDonation = async () => {
    if (!dashboard?.donor) {
      router.push("/donor/register");
      return;
    }
    if (!confirm("Confirmer que vous venez d'effectuer un don ? Cela met à jour votre historique et votre palier.")) return;
    setConfirming(true);
    try {
      const res = await fetch(`${API_URL}/donors/${dashboard.donor.id}/confirm-donation`, { method: "POST" });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      alert("Erreur lors de la confirmation");
    } finally {
      setConfirming(false);
    }
  };

  const togglePause = async () => {
    const token = getToken();
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
    if (!confirm("Supprimer définitivement votre compte ? Toutes vos données seront effacées. Cette action est irréversible.")) return;
    if (!confirm("Dernière confirmation : êtes-vous certain de vouloir supprimer votre compte ?")) return;
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/users/me`, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
      if (!res.ok) throw new Error();
      logout();
    } catch {
      alert("Erreur lors de la suppression du compte");
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Chargement...</div>;
  }

  const progressPct = dashboard?.next_tier
    ? Math.min(100, (dashboard.donation_count / dashboard.next_tier.threshold) * 100)
    : 100;

  return (
    <ErrorBoundary fallbackTitle="Erreur d'affichage du profil">
    <div className="min-h-screen bg-paper text-ink pb-safe-nav">
      <div className="container mx-auto px-5 md:px-6 pt-6 pb-4 flex justify-between items-center max-w-2xl">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Bonjour, {user.first_name}</h1>
          <p className="text-sm text-slate mt-0.5">
            {isDonor ? <>Votre don peut sauver <span className="text-vital font-semibold">plusieurs vies</span></> : "Complétez votre profil pour commencer"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/notifications" className="relative w-10 h-10 rounded-full bg-mist flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10151C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-vital" />}
          </Link>
          <button onClick={() => setShowSettings((s) => !s)} className="w-10 h-10 rounded-full bg-mist flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10151C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </button>
        </div>
      </div>

      <main className="container mx-auto px-5 md:px-6 max-w-2xl">
        {showSettings && (
          <div className="mb-5 p-4 rounded-2xl border border-line bg-white space-y-2">
            <p className="text-xs font-medium text-slate mb-1">Paramètres du compte</p>
            <Link href="/profile/verification" className="block w-full text-left px-3 py-2.5 rounded-xl hover:bg-mist transition-colors text-sm text-ink">
              Vérification email et téléphone
            </Link>
            {(user.roles || []).includes("admin") && (
              <Link href="/admin/campaigns" className="block w-full text-left px-3 py-2.5 rounded-xl hover:bg-mist transition-colors text-sm text-brand-dark font-medium">
                Administration — Campagnes
              </Link>
            )}
            <button onClick={togglePause} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-mist transition-colors text-sm text-ink">
              {isPaused ? "Réactiver mon compte" : "Mettre en pause mon compte"}
            </button>
            <button onClick={deleteAccount} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-vital-light transition-colors text-sm text-vital-dark">
              Supprimer mon compte
            </button>
            <button onClick={logout} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-mist transition-colors text-sm text-slate">
              Se déconnecter
            </button>
          </div>
        )}

        {/* Carte hero */}
        <div className="rounded-3xl bg-gradient-to-br from-brand-light to-mist p-6 md:p-7 mb-5 relative overflow-hidden">
          <div className="relative z-10 max-w-[60%]">
            {isDonor ? (
              <>
                <h2 className="font-display text-xl md:text-2xl font-bold text-ink leading-tight mb-2">
                  Groupe <span className="text-vital">{dashboard!.donor.blood_type}</span>
                </h2>
                <p className="text-sm text-slate mb-5">Merci de faire partie des donneurs qui font la différence.</p>
                <button
                  onClick={confirmDonation}
                  disabled={confirming}
                  className="px-5 py-3 bg-vital text-white rounded-full text-sm font-semibold hover:bg-vital-dark transition-colors disabled:opacity-50"
                >
                  {confirming ? "..." : "J'ai donné"}
                </button>
              </>
            ) : (
              <>
                <h2 className="font-display text-xl md:text-2xl font-bold text-ink leading-tight mb-2">
                  Un petit don pour un grand <span className="text-vital">avenir</span>.
                </h2>
                <p className="text-sm text-slate mb-5">Rejoignez les donneurs qui font la différence.</p>
                <Link href="/donor/register" className="inline-block px-5 py-3 bg-vital text-white rounded-full text-sm font-semibold hover:bg-vital-dark transition-colors">
                  Devenir donneur
                </Link>
              </>
            )}
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-90">
            <BloodDrop size={110} />
          </div>
        </div>

        {isDonor && (
          <>
            {/* Stats : eligibilite + impact */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-white rounded-2xl border border-line p-4">
                <p className="text-[11px] font-medium text-slate mb-3 tracking-wide">Prochaine éligibilité</p>
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-full bg-vital-light flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A31F2C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                  </span>
                  <div>
                    {dashboard!.eligible_now ? (
                      <p className="font-display font-bold text-ink text-base">Dès maintenant</p>
                    ) : (
                      <p className="font-display font-bold text-ink text-base">
                        {new Date(dashboard!.next_eligible_date!).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-line p-4">
                <p className="text-[11px] font-medium text-slate mb-3 tracking-wide">Mon impact</p>
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-full bg-vital-light flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A31F2C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /></svg>
                  </span>
                  <div>
                    <p className="font-display font-bold text-vital text-lg leading-none">{dashboard!.impact_count}</p>
                    <p className="text-[11px] text-slate mt-1">demande{dashboard!.impact_count !== 1 ? "s" : ""} honorée{dashboard!.impact_count !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Parcours / palier */}
            <div className="bg-white rounded-2xl border border-line p-4 md:p-5 mb-5">
              <p className="text-[11px] font-medium text-slate mb-3 tracking-wide">Votre parcours</p>
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 shrink-0">
                  <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="#EEF2F7" strokeWidth="5" />
                    <circle cx="28" cy="28" r="24" fill="none" stroke="#E13341" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 24}`} strokeDashoffset={`${2 * Math.PI * 24 * (1 - progressPct / 100)}`} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-ink">
                    {dashboard!.next_tier ? `${dashboard!.donation_count}/${dashboard!.next_tier.threshold}` : "✓"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink">
                    {dashboard!.next_tier ? `Prochain niveau : ${dashboard!.next_tier.name}` : "Niveau maximum atteint"}
                  </p>
                  <p className="text-xs text-slate mt-0.5">
                    {dashboard!.next_tier
                      ? `Encore ${dashboard!.next_tier.remaining} don${dashboard!.next_tier.remaining > 1 ? "s" : ""} pour atteindre le badge ${dashboard!.next_tier.name}`
                      : "Vous avez atteint le badge Or, merci pour votre engagement."}
                  </p>
                </div>
                {dashboard!.current_tier && (
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: TIER_STYLE[dashboard!.current_tier]?.bg }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={TIER_STYLE[dashboard!.current_tier]?.icon} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2 4 6.5V12c0 4.9 3.4 9.4 8 10.5 4.6-1.1 8-5.6 8-10.5V6.5L12 2Z" />
                    </svg>
                  </span>
                )}
              </div>
              <button onClick={toggleAvailability} className="w-full mt-4 pt-4 border-t border-line text-sm text-left flex items-center justify-between text-ink">
                <span>Statut de disponibilité</span>
                <span className={`font-medium ${dashboard!.donor.availability_status === "green" ? "text-recovery-dark" : "text-slate"}`}>
                  {dashboard!.donor.availability_status === "green" ? "Disponible ›" : "Indisponible ›"}
                </span>
              </button>
            </div>
          </>
        )}

        {/* Grille de liens utiles */}
        <p className="text-[11px] font-medium text-slate mb-3 tracking-wide">Infos utiles</p>
        <div className="grid grid-cols-4 gap-2.5 mb-6">
          {[
            { href: "/compatibility", label: "Compatibilité", icon: "M12 3s7 7.5 7 12a7 7 0 1 1-14 0c0-4.5 7-12 7-12Z" },
            { href: "/facilities", label: "Lieux de don", icon: "M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" },
            { href: "/requests", label: isRequester ? "Mes demandes" : "Demander", icon: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" },
            { href: "/notifications", label: "Notifications", icon: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9ZM13.73 21a2 2 0 0 1-3.46 0" },
          ].map((it) => (
            <Link key={it.href} href={it.href} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-line hover:border-brand/30 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10151C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={it.icon} /></svg>
              <span className="text-[11px] text-ink text-center leading-tight">{it.label}</span>
            </Link>
          ))}
        </div>

        {activeRequests.length > 0 && (
          <div className="bg-white rounded-2xl border border-line p-4 md:p-5 mb-6">
            <p className="text-[11px] font-medium text-slate mb-3 tracking-wide">Mes demandes actives</p>
            <div className="space-y-2">
              {activeRequests.slice(0, 3).map((req) => (
                <div key={req.id} className="flex justify-between items-center py-2 border-b border-line last:border-0">
                  <span className="text-sm text-ink">{req.blood_type} · {req.donation_type}</span>
                  <span className="text-xs px-2 py-0.5 bg-amber-light text-amber rounded-full font-medium">En attente</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
    </ErrorBoundary>
  );
}

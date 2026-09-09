"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminNav } from "@/components/AdminNav";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const isAdmin = (user?.roles || []).includes("admin");

  const load = async (q?: string) => {
    const token = getToken();
    const params = q ? `?search=${encodeURIComponent(q)}` : "";
    const res = await fetch(`${API_URL}/admin/users${params}`, { headers: { Authorization: "Bearer " + token } });
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    if (!isAdmin) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const toggleActive = async (u: any) => {
    setBusyId(u.id);
    const token = getToken();
    await fetch(`${API_URL}/admin/users/${u.id}/active`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ is_active: !u.is_active }),
    });
    await load(search);
    setBusyId(null);
  };

  const toggleAdmin = async (u: any) => {
    if (u.id === user?.id) { alert("Vous ne pouvez pas modifier votre propre rôle."); return; }
    const isCurrentlyAdmin = (u.roles || []).includes("admin");
    if (!confirm(isCurrentlyAdmin ? "Retirer les droits administrateur de cet utilisateur ?" : "Donner les droits administrateur à cet utilisateur ?")) return;
    setBusyId(u.id);
    const token = getToken();
    const newRoles = isCurrentlyAdmin ? (u.roles || []).filter((r: string) => r !== "admin") : [...(u.roles || []), "admin"];
    await fetch(`${API_URL}/admin/users/${u.id}/roles`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ roles: newRoles }),
    });
    await load(search);
    setBusyId(null);
  };

  const deleteUser = async (u: any) => {
    if (u.id === user?.id) { alert("Vous ne pouvez pas supprimer votre propre compte depuis cet écran."); return; }
    if (!confirm(`Supprimer définitivement le compte de ${u.first_name} (${u.email}) ? Cette action est irréversible.`)) return;
    setBusyId(u.id);
    const token = getToken();
    await fetch(`${API_URL}/admin/users/${u.id}`, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
    setUsers((prev) => prev.filter((x) => x.id !== u.id));
    setBusyId(null);
  };

  if (authLoading || loading) return <div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Chargement...</div>;
  if (!isAdmin) return <div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Accès réservé aux administrateurs.</div>;

  return (
    <ErrorBoundary fallbackTitle="Erreur d'affichage des utilisateurs">
    <div className="min-h-screen bg-paper text-ink">
      <Header />
      <main className="container mx-auto px-5 md:px-6 py-8 max-w-3xl">
        <AdminNav />
        <h1 className="font-display text-2xl font-bold text-ink mb-4">Utilisateurs ({users.length})</h1>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") load(search); }}
          placeholder="Rechercher par nom, email ou téléphone..."
          className="w-full p-2.5 border border-line rounded-lg text-sm mb-4"
        />

        <div className="space-y-2">
          {users.map((u) => {
            const isUserAdmin = (u.roles || []).includes("admin");
            return (
              <div key={u.id} className="bg-surface border border-line rounded-2xl p-4 flex justify-between items-center gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-ink text-sm">{u.first_name} {u.last_name || ""}</span>
                    {isUserAdmin && <span className="text-[10px] px-2 py-0.5 bg-vital-light text-vital-dark rounded-full font-medium">Admin</span>}
                    {!u.is_active && <span className="text-[10px] px-2 py-0.5 bg-mist text-slate rounded-full font-medium">Suspendu</span>}
                    {u.email_verified && <span className="text-[10px] px-2 py-0.5 bg-recovery-light text-recovery-dark rounded-full font-medium">Email ✓</span>}
                    {u.phone_verified && <span className="text-[10px] px-2 py-0.5 bg-recovery-light text-recovery-dark rounded-full font-medium">Tél ✓</span>}
                  </div>
                  <p className="text-xs text-slate mt-1">{u.email} {u.phone && `· ${u.phone}`}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => toggleActive(u)} disabled={busyId === u.id} className="text-xs px-3 py-1.5 bg-mist text-ink rounded-full hover:bg-line transition-colors disabled:opacity-50">
                    {u.is_active ? "Suspendre" : "Réactiver"}
                  </button>
                  <button onClick={() => toggleAdmin(u)} disabled={busyId === u.id} className="text-xs px-3 py-1.5 bg-brand-light text-brand-dark rounded-full transition-colors disabled:opacity-50">
                    {isUserAdmin ? "Retirer admin" : "Rendre admin"}
                  </button>
                  <button onClick={() => deleteUser(u)} disabled={busyId === u.id} className="text-xs px-3 py-1.5 text-vital hover:bg-vital-light rounded-full transition-colors disabled:opacity-50">
                    Supprimer
                  </button>
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

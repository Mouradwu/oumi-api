"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function DonorProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [donor, setDonor] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Charger le profil donneur existant
    const token = localStorage.getItem("token");
    fetch("'$apiBase'/donors/me", {
      headers: { Authorization: "Bearer " + token },
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          setDonor(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (!user) return null;
  if (loading) return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-white/60 hover:text-white transition">&larr; Retour</Link>
        <h1 className="text-3xl font-bold mt-6">ðŸ‘¤ Mon profil donneur</h1>

        {donor ? (
          <div className="bg-white/5 p-6 rounded-xl border border-white/10 mt-6">
            <div className="space-y-4">
              <div>
                <span className="text-white/40 text-sm">Nom</span>
                <p className="text-lg">{user.first_name} {user.last_name}</p>
              </div>
              <div>
                <span className="text-white/40 text-sm">Email</span>
                <p className="text-lg">{user.email}</p>
              </div>
              <div>
                <span className="text-white/40 text-sm">TÃ©lÃ©phone</span>
                <p className="text-lg">{user.phone || "Non renseignÃ©"}</p>
              </div>
              <div>
                <span className="text-white/40 text-sm">Groupe sanguin</span>
                <p className="text-lg font-bold text-red-400">{donor.blood_group}</p>
              </div>
              <div>
                <span className="text-white/40 text-sm">Types de don</span>
                <div className="flex gap-2 mt-1">
                  {donor.donation_types?.map((type: string) => (
                    <span key={type} className="px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-sm">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-white/40 text-sm">Wilaya</span>
                <p className="text-lg">{donor.wilaya}</p>
              </div>
              <div>
                <span className="text-white/40 text-sm">Statut</span>
                <div className="flex gap-2 mt-1">
                  {donor.availability && (
                    <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">Disponible</span>
                  )}
                  {donor.certified && (
                    <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm">âœ… CertifiÃ©</span>
                  )}
                  {donor.has_donated_before && (
                    <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-sm">
                      Dernier don: {donor.last_donation_date || "Non prÃ©cisÃ©"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-500/20 text-yellow-400 p-6 rounded-xl mt-6">
            <p className="font-semibold">âš ï¸ Vous n'Ãªtes pas encore enregistrÃ© comme donneur</p>
            <Link href="/donor/register" className="text-red-400 hover:underline mt-2 inline-block">
              â†’ Devenir donneur maintenant
            </Link>
          </div>
        )}

        <div className="mt-6 flex gap-4">
          <Link href="/donor/register" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
            {donor ? "ðŸ“ Modifier mon profil" : "âž• Devenir donneur"}
          </Link>
          <Link href="/request/create" className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition">
            ðŸ¥ CrÃ©er une demande
          </Link>
        </div>
      </div>
    </div>
  );
}
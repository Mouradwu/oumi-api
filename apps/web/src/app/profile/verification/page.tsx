"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export default function VerificationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const token = getToken();
    const res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: "Bearer " + token } });
    if (res.ok) setMe(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const resendEmail = async () => {
    setBusy(true); setError(""); setMessage("");
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/auth/resend-email-verification`, { method: "POST", headers: { Authorization: "Bearer " + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage(data.message);
    } catch (e: any) {
      setError(e.message || "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const sendOtp = async () => {
    setBusy(true); setError(""); setMessage("");
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/auth/send-phone-otp`, { method: "POST", headers: { Authorization: "Bearer " + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOtpSent(true);
      setMessage(data.message);
    } catch (e: any) {
      setError(e.message || "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setBusy(true); setError(""); setMessage("");
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/auth/verify-phone-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage(data.message);
      await load();
    } catch (e: any) {
      setError(e.message || "Erreur");
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || loading || !me) {
    return <div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Chargement...</div>;
  }

  return (
    <ErrorBoundary fallbackTitle="Erreur d'affichage de la vérification">
    <div className="min-h-screen bg-paper text-ink">
      <Header />
      <main className="container mx-auto px-5 md:px-6 py-8 max-w-md">
        <Link href="/profile" className="text-sm text-slate hover:text-ink transition-colors">&larr; Profil</Link>
        <h1 className="font-display text-2xl font-bold mt-4 mb-1 text-ink">Vérification du compte</h1>
        <p className="text-slate text-sm mb-6">
          Statut : <span className={`font-medium ${me.account_status === "active" ? "text-recovery-dark" : "text-amber"}`}>
            {me.account_status === "active" ? "Compte actif" : "En attente de vérification"}
          </span>
        </p>

        {message && <div className="bg-recovery-light text-recovery-dark p-3 rounded-xl text-sm mb-4">{message}</div>}
        {error && <div className="bg-vital-light text-vital-dark p-3 rounded-xl text-sm mb-4">{error}</div>}

        <div className="bg-white rounded-2xl border border-line p-5 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-ink text-sm">Email</p>
              <p className="text-xs text-slate mt-0.5">{me.email}</p>
            </div>
            {me.email_verified ? (
              <span className="text-xs px-2.5 py-1 bg-recovery-light text-recovery-dark rounded-full font-medium">Vérifié</span>
            ) : (
              <span className="text-xs px-2.5 py-1 bg-amber-light text-amber rounded-full font-medium">Non vérifié</span>
            )}
          </div>
          {!me.email_verified && (
            <button onClick={resendEmail} disabled={busy} className="mt-3 w-full px-4 py-2.5 bg-brand text-white text-sm rounded-full font-medium hover:bg-brand-dark transition-colors disabled:opacity-50">
              Renvoyer le lien de vérification
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-line p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-ink text-sm">Téléphone</p>
              <p className="text-xs text-slate mt-0.5">{me.phone || "Non renseigné"}</p>
            </div>
            {me.phone_verified ? (
              <span className="text-xs px-2.5 py-1 bg-recovery-light text-recovery-dark rounded-full font-medium">Vérifié</span>
            ) : (
              <span className="text-xs px-2.5 py-1 bg-amber-light text-amber rounded-full font-medium">Non vérifié</span>
            )}
          </div>
          {!me.phone_verified && me.phone && (
            <div className="mt-3 space-y-2">
              {!otpSent ? (
                <button onClick={sendOtp} disabled={busy} className="w-full px-4 py-2.5 bg-brand text-white text-sm rounded-full font-medium hover:bg-brand-dark transition-colors disabled:opacity-50">
                  Recevoir un code par SMS
                </button>
              ) : (
                <>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Code à 6 chiffres"
                    maxLength={6}
                    className="w-full p-2.5 border border-line rounded-lg text-sm text-center tracking-widest"
                  />
                  <button onClick={verifyOtp} disabled={busy || otp.length !== 6} className="w-full px-4 py-2.5 bg-brand text-white text-sm rounded-full font-medium hover:bg-brand-dark transition-colors disabled:opacity-50">
                    Valider le code
                  </button>
                  <button onClick={sendOtp} disabled={busy} className="w-full text-xs text-slate hover:text-ink transition-colors">
                    Renvoyer un code
                  </button>
                </>
              )}
            </div>
          )}
          {!me.phone && <p className="text-xs text-slate mt-2">Ajoutez un numéro de téléphone à votre profil pour le vérifier.</p>}
        </div>
      </main>
    </div>
    </ErrorBoundary>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { BrandWatermark } from "@/components/BrandWatermark";
import { API_URL } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur d'inscription");

      // Connexion immediate puis redirection directe vers la verification -
      // la verification email/telephone doit demarrer des l'inscription,
      // pas etre decouverte plus tard dans les parametres.
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        localStorage.setItem("token", loginData.access_token);
        window.location.href = "/profile/verification?welcome=true";
      } else {
        router.push("/auth/login");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary fallbackTitle="Erreur d'affichage de l'inscription">
    <div className="min-h-screen bg-paper text-ink flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <BrandWatermark className="w-[500px] h-[575px] -top-20 -right-32" />
      <div className="w-full max-w-md space-y-7 relative z-10">
        <div className="flex justify-center"><Logo size={40} /></div>
        <h1 className="font-display text-2xl font-bold text-center text-ink">Créer un compte</h1>
        <p className="text-center text-slate text-sm -mt-4">Rejoignez les donneurs qui font la différence.</p>
        {error && <div className="bg-vital-light text-vital-dark p-3 rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text" placeholder="Prénom *" value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="w-full p-3.5 bg-surface border border-line rounded-xl text-ink placeholder-slate focus:outline-none focus:border-brand"
              required
            />
            <input
              type="text" placeholder="Nom *" value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="w-full p-3.5 bg-surface border border-line rounded-xl text-ink placeholder-slate focus:outline-none focus:border-brand"
              required
            />
          </div>
          <input
            type="tel" placeholder="Téléphone *" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full p-3.5 bg-surface border border-line rounded-xl text-ink placeholder-slate focus:outline-none focus:border-brand"
            required
          />
          <input
            type="email" placeholder="Email *" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-3.5 bg-surface border border-line rounded-xl text-ink placeholder-slate focus:outline-none focus:border-brand"
            required
          />
          <input
            type="password" placeholder="Mot de passe *" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full p-3.5 bg-surface border border-line rounded-xl text-ink placeholder-slate focus:outline-none focus:border-brand"
            required
          />
          <button
            type="submit" disabled={loading}
            className="w-full bg-vital hover:bg-vital-dark text-white font-semibold py-3.5 rounded-full transition-colors disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>
        <p className="text-center text-slate text-sm">
          Déjà un compte ? <Link href="/auth/login" className="text-brand hover:text-brand-dark font-medium">Se connecter</Link>
        </p>
      </div>
    </div>
    </ErrorBoundary>
  );
}

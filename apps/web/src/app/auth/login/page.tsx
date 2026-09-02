"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { API_URL } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur de connexion");

      const token = data.access_token;
      localStorage.setItem("token", token);

      const verifyRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (!verifyRes.ok) {
        localStorage.removeItem("token");
        throw new Error("Token invalide, veuillez réessayer.");
      }

      // Redirige vers la page d'origine si l'utilisateur y a ete envoye
      // depuis un formulaire (ex: "faire une demande" sans etre connecte).
      // Si le compte n'est pas encore verifie, priorite a l'ecran de
      // verification (la verification doit demarrer des la connexion,
      // pas rester cachee dans les parametres).
      const redirect = searchParams.get("redirect");
      if (data.user?.account_status !== "active") {
        window.location.href = "/profile/verification";
      } else {
        window.location.href = redirect || "/profile";
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-7">
        <div className="flex justify-center"><Logo size={40} /></div>
        <h1 className="font-display text-2xl font-bold text-center text-ink">Se connecter</h1>
        {error && <div className="bg-vital-light text-vital-dark p-3 rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-3.5 bg-surface border border-line rounded-xl text-ink placeholder-slate focus:outline-none focus:border-brand"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full p-3.5 bg-surface border border-line rounded-xl text-ink placeholder-slate focus:outline-none focus:border-brand"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white font-semibold py-3.5 rounded-full hover:bg-brand-dark disabled:opacity-50 transition-colors"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p className="text-center text-slate text-sm">
          Pas encore de compte ? <Link href="/auth/register" className="text-brand hover:text-brand-dark font-medium">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Chargement...</div>}>
      <LoginForm />
    </Suspense>
  );
}

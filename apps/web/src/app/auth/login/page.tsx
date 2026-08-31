"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("https://oumiapi-production.up.railway.app/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur de connexion");
      localStorage.setItem("token", data.access_token);
      router.push("/profile");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {success && <div className="bg-green-500/20 text-green-400 p-3 rounded-lg text-sm">✅ Compte créé ! Connectez-vous.</div>}
      {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-white/90 disabled:opacity-50 transition"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <Logo size={36} />
        <h1 className="text-2xl font-bold text-center">Se connecter</h1>
        <Suspense fallback={<div className="text-white/50">Chargement...</div>}>
          <LoginForm />
        </Suspense>
        <p className="text-center text-white/50 text-sm">
          Pas encore de compte ? <Link href="/auth/register" className="text-red-400 hover:underline">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}

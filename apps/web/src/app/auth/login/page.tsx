"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { API_URL } from "@/lib/api";

export default function LoginPage() {
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

      // Vérifier que le token est valide
      const verifyRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (!verifyRes.ok) {
        localStorage.removeItem("token");
        throw new Error("Token invalide, veuillez réessayer.");
      }

      // Redirection
      window.location.href = "/profile";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <Logo size={36} />
        <h1 className="text-2xl font-bold text-center">Se connecter</h1>
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
        <p className="text-center text-white/50 text-sm">
          Pas encore de compte ? <Link href="/auth/register" className="text-red-400 hover:underline">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}

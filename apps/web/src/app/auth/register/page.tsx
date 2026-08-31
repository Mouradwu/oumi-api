"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";

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
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("https://oumiapi-production.up.railway.app/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur d'inscription");
      setSuccess(true);
      // Rediriger vers la page de connexion après 2 secondes
      setTimeout(() => router.push("/auth/login?registered=true"), 2000);
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
        <h1 className="text-2xl font-bold text-center">Créer un compte</h1>
        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm">{error}</div>}
        {success && <div className="bg-green-500/20 text-green-400 p-3 rounded-lg text-sm">✅ Compte créé ! Redirection vers la connexion...</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Prénom *"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
            required
          />
          <input
            type="text"
            placeholder="Nom *"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
            required
          />
          <input
            type="tel"
            placeholder="Téléphone *"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
            required
          />
          <input
            type="email"
            placeholder="Email *"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe *"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>
        <p className="text-center text-white/50 text-sm">
          Déjà un compte ? <Link href="/auth/login" className="text-red-400 hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

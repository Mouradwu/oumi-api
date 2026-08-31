"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", name: "", wilayaId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = "https://oumiapi-production.up.railway.app";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(\/auth/register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur d'inscription");
      router.push("/auth/login");
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Nom complet" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40" required />
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40" required />
          <input type="password" placeholder="Mot de passe" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40" required />
          <input type="text" placeholder="Code wilaya (ex: 16)" value={form.wilayaId} onChange={(e) => setForm({ ...form, wilayaId: e.target.value })} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40" />
          <button type="submit" disabled={loading} className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-white/90 disabled:opacity-50 transition">{loading ? "Inscription..." : "S'inscrire"}</button>
        </form>
        <p className="text-center text-white/50 text-sm">Déjà un compte ? <Link href="/auth/login" className="text-red-400 hover:underline">Se connecter</Link></p>
      </div>
    </div>
  );
}
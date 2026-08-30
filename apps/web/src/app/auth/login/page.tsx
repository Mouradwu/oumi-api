"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { translations, type Lang } from "@/lib/translations";

export default function LoginPage() {
  const [lang, setLang] = useState<Lang>("fr");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const t = translations[lang];
  const isRTL = lang === "ar";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Connecter à l'API
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6"
      style={{ fontFamily: isRTL ? "var(--font-tajawal)" : "var(--font-inter)" }}
    >
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
      </div>

      {/* Lang switch */}
      <div className="absolute top-6 right-6">
        <button
          onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
          className="px-3 py-1.5 text-xs font-medium border border-white/10 rounded-full hover:bg-white/5 transition"
        >
          {lang === "fr" ? "العربية" : "FR"}
        </button>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Logo size={40} />
          </Link>
          <h1 className="text-3xl font-bold mb-2">
            {isRTL ? "تسجيل الدخول" : "Connexion"}
          </h1>
          <p className="text-white/60">
            {isRTL ? "مرحباً بعودتك" : "Ravi de vous revoir"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">
              {isRTL ? "البريد الإلكتروني" : "Email"}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 transition"
              placeholder={isRTL ? "أدخل بريدك" : "vous@exemple.com"}
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">
              {isRTL ? "كلمة المرور" : "Mot de passe"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition disabled:opacity-50"
          >
            {loading ? (isRTL ? "جاري..." : "Connexion...") : (isRTL ? "دخول" : "Se connecter")}
          </button>
        </form>

        <p className="text-center text-sm text-white/40 mt-6">
          {isRTL ? "ليس لديك حساب؟" : "Pas encore de compte ?"}{" "}
          <Link href="/auth/register" className="text-white hover:underline">
            {isRTL ? "سجل الآن" : "S'inscrire"}
          </Link>
        </p>
      </div>
    </div>
  );
}
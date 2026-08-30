"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { translations, type Lang } from "@/lib/translations";

interface Wilaya {
  id: number;
  code: string;
  name_fr: string;
  name_ar: string;
}

export default function RegisterPage() {
  const [lang, setLang] = useState<Lang>("fr");
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    wilaya: "",
  });
  const [loading, setLoading] = useState(false);

  const t = translations[lang];
  const isRTL = lang === "ar";

  useEffect(() => {
    fetch("https://oumiapi-production.up.railway.app/wilayas")
      .then((res) => res.json())
      .then((data) => {
        console.log("Wilayas chargées:", data.length);
        setWilayas(data);
      })
      .catch((err) => console.error("Erreur wilayas:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-[#0a0a0f] text-white py-12 px-6"
      style={{ fontFamily: isRTL ? "var(--font-tajawal)" : "var(--font-inter)" }}
    >
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
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

      {/* Register Card */}
      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Logo size={40} />
          </Link>
          <h1 className="text-3xl font-bold mb-2">
            {isRTL ? "إنشاء حساب" : "Devenir donneur"}
          </h1>
          <p className="text-white/60">
            {isRTL ? "انضم إلينا وأنقذ حياة" : "Rejoignez-nous et sauvez des vies"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">
                {isRTL ? "الاسم الكامل" : "Nom complet"}
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 transition"
                placeholder={isRTL ? "أحمد محمد" : "Jean Dupont"}
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">
                {isRTL ? "البريد الإلكتروني" : "Email"}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 transition"
                placeholder="vous@exemple.com"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">
                {isRTL ? "رقم الهاتف" : "Téléphone"}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 transition"
                placeholder="0550123456"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">
                {isRTL ? "الولاية" : "Wilaya"}
              </label>
              <div className="relative">
                <select
                  value={formData.wilaya}
                  onChange={(e) => setFormData({...formData, wilaya: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-[#0f0f1a] border border-white/20 rounded-xl text-white focus:outline-none focus:border-red-500/50 transition appearance-none cursor-pointer [&>option]:bg-[#0f0f1a] [&>option]:text-white"
                >
                  <option value="" className="bg-[#0f0f1a] text-white/40">
                    {isRTL ? "اختر الولاية" : "Sélectionnez votre wilaya"}
                  </option>
                  {wilayas.map((w) => (
                    <option
                      key={w.id}
                      value={w.code}
                      className="bg-[#0f0f1a] text-white hover:bg-red-600"
                    >
                      {w.code} - {isRTL ? w.name_ar : w.name_fr}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">
              {isRTL ? "كلمة المرور" : "Mot de passe"}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
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
            {loading ? (isRTL ? "جاري..." : "Création...") : (isRTL ? "إنشاء الحساب" : "Créer mon compte")}
          </button>
        </form>

        <div className="text-center mt-4 text-xs text-white/40">
          {wilayas.length} wilayas disponibles
        </div>

        <p className="text-center text-sm text-white/40 mt-6">
          {isRTL ? "لديك حساب بالفعل؟" : "Déjà un compte ?"}{" "}
          <Link href="/auth/login" className="text-white hover:underline">
            {isRTL ? "سجل الدخول" : "Se connecter"}
          </Link>
        </p>
      </div>
    </div>
  );
}
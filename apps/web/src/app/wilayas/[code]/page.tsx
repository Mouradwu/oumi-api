"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";

interface Wilaya {
  id: number;
  code: string;
  name_fr: string;
  name_ar: string;
  latitude: number;
  longitude: number;
}

export default function WilayaDetailPage() {
  const params = useParams<{ code: string }>();
  const code = params?.code;
  const [wilaya, setWilaya] = useState<Wilaya | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE = "https://oumiapi-production.up.railway.app";

  useEffect(() => {
    if (!code) return;
    fetch(\/wilayas/\)
      .then((res) => {
        if (!res.ok) throw new Error("Wilaya non trouvée");
        return res.json();
      })
      .then((data) => {
        setWilaya(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [code]);

  if (loading) return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">Chargement...</div>;
  if (error) return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center text-red-500">Erreur : {error}</div>;
  if (!wilaya) return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">Aucune donnée</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/wilayas" className="text-white/60 hover:text-white transition">&larr; Retour à la liste</Link>
        <h1 className="text-4xl font-bold mt-6">{wilaya.name_fr} ({wilaya.code})</h1>
        <p className="text-xl text-white/60 mt-2">{wilaya.name_ar}</p>
        <div className="mt-6 grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl">
          <div><span className="text-white/40">Latitude :</span> {wilaya.latitude}</div>
          <div><span className="text-white/40">Longitude :</span> {wilaya.longitude}</div>
        </div>
      </div>
    </div>
  );
}
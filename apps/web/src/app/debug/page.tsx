"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";

export default function DebugPage() {
  const { user, logout } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          setTokenInfo(payload);
        }
      } catch (e) {
        setTokenInfo({ error: "Token invalide" });
      }
    }
    setLoading(false);
  }, []);

  const testApi = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setApiResponse({ error: "Aucun token trouvé" });
      return;
    }
    try {
      const res = await fetch(`${API_URL}/donors/me`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      setApiResponse({ status: res.status, data });
    } catch (err: any) {
      setApiResponse({ error: err.message });
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Debug - Authentification</h1>

        <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-4">
          <h2 className="text-lg font-semibold mb-2">📋 Utilisateur</h2>
          {user ? (
            <pre className="text-sm text-white/60 overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          ) : (
            <p className="text-yellow-400">Non connecté</p>
          )}
        </div>

        <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-4">
          <h2 className="text-lg font-semibold mb-2">🔑 Token JWT</h2>
          {tokenInfo ? (
            <pre className="text-sm text-white/60 overflow-auto">
              {JSON.stringify(tokenInfo, null, 2)}
            </pre>
          ) : (
            <p className="text-yellow-400">Aucun token trouvé</p>
          )}
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={testApi}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            🧪 Tester /donors/me
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.reload();
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
          >
            🔄 Réinitialiser
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            🚪 Déconnexion
          </button>
        </div>

        {apiResponse && (
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <h2 className="text-lg font-semibold mb-2">📡 Réponse API</h2>
            <pre className="text-sm text-white/60 overflow-auto">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6 text-sm text-white/40">
          <p>🔗 <a href="/" className="text-red-400 hover:underline">Retour à l'accueil</a></p>
        </div>
      </div>
    </div>
  );
}
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  wilayaId?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = "https://oumiapi-production.up.railway.app";

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(${API_BASE}/auth/me, {
        headers: { Authorization: Bearer  },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Token invalide");
        })
        .then((data) => {
          setUser(data);
        })
        .catch(() => {
          localStorage.removeItem("token");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(${API_BASE}/auth/login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erreur de connexion");
    localStorage.setItem("token", data.access_token);
    // Récupérer le profil
    const userRes = await fetch(${API_BASE}/auth/me, {
      headers: { Authorization: Bearer  },
    });
    const userData = await userRes.json();
    setUser(userData);
  };

  const register = async (formData: any) => {
    const res = await fetch(${API_BASE}/auth/register, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erreur d'inscription");
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
}
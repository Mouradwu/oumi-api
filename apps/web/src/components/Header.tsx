"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";

export default function Header() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <header className="border-b border-white/5 backdrop-blur-xl bg-black/20 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/"><Logo size={28} /></Link>
        <nav className="hidden md:flex gap-6">
          <Link href="/" className="text-sm text-white/70 hover:text-white">Accueil</Link>
          <Link href="/explorer" className="text-sm text-white/70 hover:text-white">Explorer</Link>
          {user && (
            <>
              <Link href="/profile" className="text-sm text-white/70 hover:text-white">Profil</Link>
              <Link href="/notifications" className="text-sm text-white/70 hover:text-white relative">
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-white/60">Bonjour {user.first_name}</span>
              <button onClick={logout} className="text-sm text-red-400 hover:text-red-300 transition">Déconnexion</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-white/70 hover:text-white">Connexion</Link>
              <Link href="/auth/register" className="px-4 py-1.5 text-xs font-medium bg-white text-black rounded-full hover:bg-white/90 transition">S'inscrire</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

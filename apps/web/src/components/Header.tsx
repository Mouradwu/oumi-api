"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";

export default function Header() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur-md border-b border-line">
      <div className="container mx-auto px-5 md:px-6 h-16 flex justify-between items-center">
        <Link href="/"><Logo size={26} /></Link>

        <nav className="hidden md:flex items-center gap-7">
          <Link href="/" className="text-sm text-slate hover:text-ink transition-colors">Accueil</Link>
          <Link href="/explorer" className="text-sm text-slate hover:text-ink transition-colors">Explorer</Link>
          <Link href="/campaigns" className="text-sm text-slate hover:text-ink transition-colors">Campagnes</Link>
          <Link href="/compatibility" className="text-sm text-slate hover:text-ink transition-colors">Compatibilité</Link>
          <Link href="/facilities" className="text-sm text-slate hover:text-ink transition-colors">Établissements</Link>
          {user && <Link href="/requests" className="text-sm text-slate hover:text-ink transition-colors">Mes demandes</Link>}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/notifications" className="relative hidden md:flex w-9 h-9 items-center justify-center rounded-full bg-mist hover:bg-line transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B6472" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-vital text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/profile" className="hidden md:flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-mist transition-colors">
                <span className="w-7 h-7 rounded-full bg-brand-light text-brand-dark text-xs font-semibold flex items-center justify-center">
                  {user.first_name?.[0]?.toUpperCase() || "?"}
                </span>
                <span className="text-sm text-ink font-medium">{user.first_name}</span>
              </Link>
              <button onClick={logout} className="hidden md:block text-sm text-slate hover:text-vital transition-colors">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hidden md:block text-sm text-slate hover:text-ink transition-colors">Connexion</Link>
              <Link href="/auth/register" className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-full hover:bg-brand-dark transition-colors">
                S'inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

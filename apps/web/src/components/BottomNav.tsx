"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const ITEMS = [
  { href: "/", icon: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z", label: "Accueil" },
  { href: "/explorer", icon: "m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z", label: "Explorer" },
  { href: "/compatibility", icon: "M12 3s7 7.5 7 12a7 7 0 1 1-14 0c0-4.5 7-12 7-12Z", label: "Compat." },
  { href: "/facilities", icon: "M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z", label: "Lieux" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const lastItem = user
    ? { href: "/profile", icon: "M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", label: "Profil" }
    : { href: "/auth/login", icon: "M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", label: "Connexion" };

  const items = [...ITEMS, lastItem];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper/95 backdrop-blur-md border-t border-line pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 w-16 h-full"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#1554D6" : "#9AA4B2"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              <span className={`text-[10px] font-medium ${active ? "text-clinical" : "text-slate"}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

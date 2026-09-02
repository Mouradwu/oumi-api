"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";

const LEFT_ITEMS = [
  { href: "/", icon: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z", label: "Accueil" },
  { href: "/requests", icon: "M8 2v3M16 2v3M3.5 9h17M4 5h16a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z", label: "Demandes" },
];

const RIGHT_ITEMS = [
  { href: "/compatibility", icon: "M4 6h16M4 12h10M4 18h16", label: "Impact" },
];

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const profileItem = user
    ? { href: "/profile", icon: "M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", label: "Profil" }
    : { href: "/auth/login", icon: "M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", label: "Profil" };

  const handleCenterAction = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/donors/me?userId=${user.id}`, { headers: { Authorization: "Bearer " + token } });
      if (res.status === 404) {
        router.push("/donor/register");
        return;
      }
      const donor = await res.json();
      if (!confirm("Confirmer que vous venez d'effectuer un don ?")) return;
      await fetch(`${API_URL}/donors/${donor.id}/confirm-donation`, { method: "POST" });
      router.push("/profile");
    } catch {
      router.push("/donor/register");
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-line pb-[env(safe-area-inset-bottom)]">
      <div className="relative flex justify-around items-center h-16">
        {LEFT_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-1 w-14 h-full">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? "#E13341" : "#9AA4B2"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              <span className={`text-[10px] font-medium ${active ? "text-vital" : "text-slate"}`}>{item.label}</span>
            </Link>
          );
        })}

        <button onClick={handleCenterAction} className="relative -mt-7 flex flex-col items-center justify-center gap-1 w-14">
          <span className="w-14 h-14 rounded-full bg-vital shadow-soft flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2s7 7.5 7 12a7 7 0 1 1-14 0c0-4.5 7-12 7-12Z" />
              <path d="M12 9v4M10 11h4" />
            </svg>
          </span>
          <span className="text-[10px] font-medium text-vital">Je donne</span>
        </button>

        {RIGHT_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-1 w-14 h-full">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? "#E13341" : "#9AA4B2"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              <span className={`text-[10px] font-medium ${active ? "text-vital" : "text-slate"}`}>{item.label}</span>
            </Link>
          );
        })}

        <Link href={profileItem.href} className="flex flex-col items-center justify-center gap-1 w-14 h-full">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={pathname === profileItem.href ? "#E13341" : "#9AA4B2"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={profileItem.icon} />
          </svg>
          <span className={`text-[10px] font-medium ${pathname === profileItem.href ? "text-vital" : "text-slate"}`}>{profileItem.label}</span>
        </Link>
      </div>
    </nav>
  );
}

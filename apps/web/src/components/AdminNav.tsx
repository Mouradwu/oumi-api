import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/users", label: "Utilisateurs" },
  { href: "/admin/donors", label: "Donneurs" },
  { href: "/admin/requests", label: "Demandes" },
  { href: "/admin/campaigns", label: "Campagnes" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 mb-6 border-b border-line overflow-x-auto">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            pathname === t.href ? "border-vital text-ink" : "border-transparent text-slate hover:text-ink"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

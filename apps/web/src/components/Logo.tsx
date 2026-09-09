import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
  light?: boolean;
  /** "compact" = icone + texte code, pour un header etroit.
   *  "full" = lockup vertical officiel complet (splash, pages institutionnelles). */
  variant?: "compact" | "full";
  /** Affiche la signature du createur sous le logo - reservee aux emplacements
   *  principaux (accueil, connexion, inscription), pas aux petits headers. */
  showSignature?: boolean;
}

// Utilise les assets officiels fournis (public/brand/) - le symbole n'est
// jamais redessine en CSS/SVG, conformement a la charte BLOODZ.
export function Logo({ size = 32, className = "", light = false, variant = "compact", showSignature = false }: LogoProps) {
  const signature = showSignature ? (
    <span
      className={`block text-center tracking-[0.2em] font-medium ${light ? "text-white/40" : "text-slate/70"}`}
      style={{ fontSize: Math.max(9, size * 0.24) }}
    >
      @NED
    </span>
  ) : null;

  if (variant === "full") {
    return (
      <div className={`flex flex-col items-center gap-1.5 ${className}`}>
        <Image
          src={light ? "/brand/logo-dark.png" : "/brand/logo-principal.png"}
          alt="BLOODZ - Donner son sang, sauver des vies"
          width={size * 3}
          height={size * 3 * (light ? 190 / 615 : 430 / 580)}
          priority
        />
        {signature}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-0.5 ${className}`}>
      <div className="flex items-center gap-2">
        <Image src="/brand/app-icon.png" alt="BLOODZ" width={size} height={size} className="shrink-0 rounded-[22%]" priority />
        <span className={`font-display font-bold tracking-tight ${light ? "text-white" : "text-ink"}`} style={{ fontSize: size * 0.72 }}>
          BLOOD<span className="text-vital">Z</span>
        </span>
      </div>
      {signature}
    </div>
  );
}

import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
  light?: boolean;
  /** "compact" = icone + texte code, pour un header etroit.
   *  "full" = lockup vertical officiel complet (splash, pages institutionnelles). */
  variant?: "compact" | "full";
}

// Utilise les assets officiels fournis (public/brand/) - le symbole n'est
// jamais redessine en CSS/SVG, conformement a la charte BLOODZ.
export function Logo({ size = 32, className = "", light = false, variant = "compact" }: LogoProps) {
  if (variant === "full") {
    return (
      <Image
        src={light ? "/brand/logo-dark.png" : "/brand/logo-principal.png"}
        alt="BLOODZ - Donner son sang, sauver des vies"
        width={size * 3}
        height={size * 3 * (light ? 190 / 615 : 430 / 580)}
        className={className}
        priority
      />
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image src="/brand/app-icon.png" alt="BLOODZ" width={size} height={size} className="shrink-0 rounded-[22%]" priority />
      <span className={`font-display font-bold tracking-tight ${light ? "text-white" : "text-ink"}`} style={{ fontSize: size * 0.72 }}>
        BLOOD<span className="text-vital">Z</span>
      </span>
    </div>
  );
}

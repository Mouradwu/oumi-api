"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Doublon orphelin de /requester/register (memes objectif, formulaire
// moins abouti, et un bug reel : donation_type utilisait "Sang"/"Plasma"
// au lieu du format canonique "SANG"/"PLASMA"/"PLAQUETTES" utilise
// partout ailleurs dans l'app, ce qui aurait casse les filtres et badges
// de compatibilite pour toute demande creee ici). Plus lie depuis nulle
// part - redirige vers la version consolidee et correcte.
export default function CreateRequestRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/requester/register");
  }, [router]);
  return <ErrorBoundary><div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Redirection...</div></ErrorBoundary>;
}

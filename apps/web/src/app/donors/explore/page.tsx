"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Cette page faisait doublon avec l'onglet "Donneurs" de /explorer (memes
// filtres, memes donnees, actions moins abouties) et n'etait plus liee
// depuis nulle part dans l'application - redirige vers la version
// consolidee plutot que de maintenir deux ecrans divergents.
export default function ExploreDonorsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/explorer");
  }, [router]);
  return <div className="min-h-screen bg-paper flex items-center justify-center text-slate text-sm">Redirection...</div>;
}

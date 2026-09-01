"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
}

// Filet de securite : si une donnee inattendue (venant d'une base qui a
// traverse plusieurs generations de schema) fait planter le rendu d'une
// page, on affiche un message clair avec un bouton pour reessayer plutot
// que de laisser Next.js afficher une page entierement blanche.
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Erreur interceptee par ErrorBoundary:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <p className="text-4xl mb-4">⚠️</p>
            <h2 className="text-xl font-semibold mb-2">{this.props.fallbackTitle || "Une erreur est survenue"}</h2>
            <p className="text-white/50 mb-6 text-sm">
              Certaines données affichées n'ont pas pu être chargées correctement.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

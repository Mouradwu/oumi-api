// URL de base de l'API OUMI. Lit la variable d'environnement Next.js
// NEXT_PUBLIC_API_URL (definie sur Railway pour le service front) et
// retombe sur l'URL de production si elle est absente (ex. en dev local
// sans .env.local).
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://oumiapi-production.up.railway.app";

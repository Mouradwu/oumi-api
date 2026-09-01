// Certaines lignes en base ont pu etre creees avant une correction de
// schema (ex: donation_types stocke en texte simple au lieu d'un vrai
// tableau Postgres, sur des donnees historiques anterieures a la
// stabilisation du schema). Plutot que de faire planter tout le rendu
// React quand .join()/.includes() rencontre une valeur inattendue, on
// normalise systematiquement en tableau avant utilisation.
export function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.length > 0) {
    // gere a la fois "SANG" et "SANG,PLASMA" (ancien format simple-array)
    return value.split(",").map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

import { Injectable } from '@nestjs/common';

export type BloodProduct = 'SANG' | 'PLASMA' | 'PLAQUETTES';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export const VALID_BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const VALID_PRODUCTS: BloodProduct[] = ['SANG', 'PLASMA', 'PLAQUETTES'];

type ABO = 'A' | 'B' | 'AB' | 'O';
type Rh = '+' | '-';

function splitType(bt: BloodType): { abo: ABO; rh: Rh } {
  const rh = bt.slice(-1) as Rh;
  const abo = bt.slice(0, -1) as ABO;
  return { abo, rh };
}

// ============================================================================
// MATRICES DE COMPATIBILITE - reproduites EXACTEMENT telles que specifiees.
// Ne pas modifier ces regles silencieusement (voir avertissements ci-dessous
// pour les points signales comme potentiellement discutables).
// ============================================================================

// SANG / GLOBULES ROUGES
// ABO : le donneur peut donner aux groupes receveurs listes.
const BLOOD_ABO_CAN_GIVE_TO: Record<ABO, ABO[]> = {
  O: ['O', 'A', 'B', 'AB'],
  A: ['A', 'AB'],
  B: ['B', 'AB'],
  AB: ['AB'],
};
// Rhesus : Rh- donne a Rh- et Rh+ ; Rh+ donne uniquement a Rh+.
function bloodRhCompatible(donorRh: Rh, recipientRh: Rh): boolean {
  if (donorRh === '-') return true;
  return recipientRh === '+';
}

// PLASMA (ABO inverse par rapport au sang)
const PLASMA_ABO_CAN_GIVE_TO: Record<ABO, ABO[]> = {
  AB: ['O', 'A', 'B', 'AB'],
  A: ['A', 'AB'],
  B: ['B', 'AB'],
  O: ['O'],
};
// Rhesus (regle du projet) : Rh- ne donne PAS a Rh+ ; toutes les autres
// combinaisons (Rh+ -> Rh-, Rh- -> Rh-, et par deduction Rh+ -> Rh+) sont
// compatibles.
function plasmaRhCompatible(donorRh: Rh, recipientRh: Rh): boolean {
  return !(donorRh === '-' && recipientRh === '+');
}

// PLAQUETTES (MVP) - meme table ABO que le sang, Rhesus totalement ignore.
const PLATELET_ABO_CAN_GIVE_TO: Record<ABO, ABO[]> = {
  O: ['O', 'A', 'B', 'AB'],
  A: ['A', 'AB'],
  B: ['B', 'AB'],
  AB: ['AB'],
};

export interface CompatibilityResult {
  compatible: boolean;
  isUniversalDonor: boolean; // pertinent pour ce produit precis
  note: string;
}

@Injectable()
export class CompatibilityService {
  /**
   * Determine si `donorType` peut donner `product` a `recipientType`.
   *
   * AVERTISSEMENT MEDICAL (signale, non corrige silencieusement - voir
   * consigne explicite de ne jamais modifier les regles sans le dire) :
   * la matrice PLASMA fournie pour les groupes A et B ("A -> A, AB" et
   * "B -> B, AB") reprend la table du SANG plutot que la table plasma
   * habituellement enseignee (ou un donneur A donne generalement a A et O,
   * pas AB, et un donneur B a B et O, pas AB). Seuls les cas O (donneur
   * universel receveur) et AB (donneur universel plasma) sont correctement
   * inverses. Implementee ici EXACTEMENT comme specifie ; a faire valider
   * par un professionnel de sante avant tout usage reel.
   */
  isCompatible(donorType: BloodType, recipientType: BloodType, product: BloodProduct): CompatibilityResult {
    const donor = splitType(donorType);
    const recipient = splitType(recipientType);

    let compatible: boolean;
    let isUniversalDonor: boolean;

    if (product === 'SANG') {
      compatible =
        BLOOD_ABO_CAN_GIVE_TO[donor.abo].includes(recipient.abo) && bloodRhCompatible(donor.rh, recipient.rh);
      isUniversalDonor = donorType === 'O-';
    } else if (product === 'PLASMA') {
      compatible =
        PLASMA_ABO_CAN_GIVE_TO[donor.abo].includes(recipient.abo) && plasmaRhCompatible(donor.rh, recipient.rh);
      isUniversalDonor = donorType === 'AB+';
    } else {
      // PLAQUETTES : Rhesus ignore
      compatible = PLATELET_ABO_CAN_GIVE_TO[donor.abo].includes(recipient.abo);
      isUniversalDonor = donor.abo === 'O'; // "compatibilite ABO large", pas "donneur universel"
    }

    return {
      compatible,
      isUniversalDonor,
      note: 'Compatibilité indicative — ne remplace jamais la validation d\'un professionnel de santé ou d\'un service de transfusion.',
    };
  }

  /** Liste les groupes donneurs compatibles pour un receveur et un produit donnes. */
  getCompatibleDonorTypes(recipientType: BloodType, product: BloodProduct): BloodType[] {
    return VALID_BLOOD_TYPES.filter((donorType) => this.isCompatible(donorType, recipientType, product).compatible);
  }

  /** Le badge "donneur universel" (ou equivalent) pour un groupe et un produit donnes. */
  universalDonorBadge(donorType: BloodType, product: BloodProduct): string | null {
    if (product === 'SANG' && donorType === 'O-') return '⭐ Donneur universel';
    if (product === 'PLASMA' && donorType === 'AB+') return '⭐ Donneur universel de plasma';
    if (product === 'PLAQUETTES' && donorType.startsWith('O')) return '⭐ Compatibilité ABO large';
    return null;
  }
}

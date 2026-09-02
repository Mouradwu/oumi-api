import { CompatibilityService, VALID_BLOOD_TYPES, BloodType, BloodProduct } from './compatibility.service';

describe('CompatibilityService', () => {
  const service = new CompatibilityService();

  // ==========================================================================
  // 192 COMBINAISONS (8 donneurs x 8 receveurs x 3 produits)
  // Verifie la matrice complete par recalcul independant (reference), pas
  // seulement par rapport au service lui-meme.
  // ==========================================================================

  function splitAboRh(bt: BloodType) {
    return { abo: bt.slice(0, -1), rh: bt.slice(-1) };
  }

  function referenceBlood(d: BloodType, r: BloodType): boolean {
    const donor = splitAboRh(d), recipient = splitAboRh(r);
    const abo: Record<string, string[]> = { O: ['O', 'A', 'B', 'AB'], A: ['A', 'AB'], B: ['B', 'AB'], AB: ['AB'] };
    const rhOk = donor.rh === '-' ? true : recipient.rh === '+';
    return abo[donor.abo].includes(recipient.abo) && rhOk;
  }

  function referencePlasma(d: BloodType, r: BloodType): boolean {
    const donor = splitAboRh(d), recipient = splitAboRh(r);
    const abo: Record<string, string[]> = { AB: ['O', 'A', 'B', 'AB'], A: ['A', 'AB'], B: ['B', 'AB'], O: ['O'] };
    const rhOk = !(donor.rh === '-' && recipient.rh === '+');
    return abo[donor.abo].includes(recipient.abo) && rhOk;
  }

  function referencePlatelet(d: BloodType, r: BloodType): boolean {
    const donor = splitAboRh(d), recipient = splitAboRh(r);
    const abo: Record<string, string[]> = { O: ['O', 'A', 'B', 'AB'], A: ['A', 'AB'], B: ['B', 'AB'], AB: ['AB'] };
    return abo[donor.abo].includes(recipient.abo);
  }

  const allCombos: [BloodType, BloodType, BloodProduct][] = [];
  for (const d of VALID_BLOOD_TYPES) {
    for (const r of VALID_BLOOD_TYPES) {
      for (const p of ['SANG', 'PLASMA', 'PLAQUETTES'] as BloodProduct[]) {
        allCombos.push([d, r, p]);
      }
    }
  }

  it('couvre exactement 192 combinaisons (8x8x3)', () => {
    expect(allCombos.length).toBe(192);
  });

  test.each(allCombos)('%s -> %s (%s)', (donor, recipient, product) => {
    const expected =
      product === 'SANG' ? referenceBlood(donor, recipient) :
      product === 'PLASMA' ? referencePlasma(donor, recipient) :
      referencePlatelet(donor, recipient);
    expect(service.isCompatible(donor, recipient, product).compatible).toBe(expected);
  });

  // ==========================================================================
  // CAS EXPLICITES DE LA SPEC (verification directe, independante du calcul)
  // ==========================================================================

  describe('cas explicites - SANG', () => {
    const cases: [BloodType, BloodType, boolean][] = [
      ['O-', 'AB+', true],
      ['O+', 'AB-', false],
      ['A+', 'A+', true],
      ['A+', 'B+', false],
      ['B+', 'A+', false],
      ['AB+', 'AB+', true],
      ['AB+', 'A+', false],
    ];
    test.each(cases)('%s -> %s = %s', (d, r, expected) => {
      expect(service.isCompatible(d, r, 'SANG').compatible).toBe(expected);
    });
  });

  describe('cas explicites - PLASMA', () => {
    const cases: [BloodType, BloodType, boolean][] = [
      ['AB+', 'A+', true],
      ['AB+', 'O-', true],
      ['O+', 'O+', true],
      ['O+', 'A+', false],
      ['A+', 'AB+', true],
      ['B+', 'A+', false],
    ];
    test.each(cases)('%s -> %s = %s', (d, r, expected) => {
      expect(service.isCompatible(d, r, 'PLASMA').compatible).toBe(expected);
    });
  });

  describe('cas explicites - PLAQUETTES', () => {
    const cases: [BloodType, BloodType, boolean][] = [
      ['O+', 'AB-', true],
      ['A-', 'AB+', true],
      ['B+', 'AB-', true],
      ['AB+', 'O+', false],
    ];
    test.each(cases)('%s -> %s = %s', (d, r, expected) => {
      expect(service.isCompatible(d, r, 'PLAQUETTES').compatible).toBe(expected);
    });
  });

  // ==========================================================================
  // DONNEURS UNIVERSELS / BADGES
  // ==========================================================================

  it('O- est donneur universel pour le sang', () => {
    expect(service.universalDonorBadge('O-', 'SANG')).toBe('⭐ Donneur universel');
    for (const r of VALID_BLOOD_TYPES) {
      expect(service.isCompatible('O-', r, 'SANG').compatible).toBe(true);
    }
  });

  it('AB+ est donneur universel de plasma', () => {
    expect(service.universalDonorBadge('AB+', 'PLASMA')).toBe('⭐ Donneur universel de plasma');
    for (const r of VALID_BLOOD_TYPES) {
      expect(service.isCompatible('AB+', r, 'PLASMA').compatible).toBe(true);
    }
  });

  it('donneurs O ont une compatibilite ABO large pour les plaquettes (pas "universel")', () => {
    expect(service.universalDonorBadge('O+', 'PLAQUETTES')).toBe('⭐ Compatibilité ABO large');
    expect(service.universalDonorBadge('O-', 'PLAQUETTES')).toBe('⭐ Compatibilité ABO large');
  });

  it("n'attribue aucun badge a un groupe non pertinent", () => {
    expect(service.universalDonorBadge('A+', 'SANG')).toBeNull();
    expect(service.universalDonorBadge('B+', 'PLASMA')).toBeNull();
  });

  // ==========================================================================
  // VALIDATION DES ENTREES
  // ==========================================================================

  it('getCompatibleDonorTypes retourne uniquement des groupes valides', () => {
    const donors = service.getCompatibleDonorTypes('AB+', 'SANG');
    expect(donors.sort()).toEqual(['A+', 'A-', 'AB+', 'AB-', 'B+', 'B-', 'O+', 'O-'].sort());
    // AB+ receveur de sang peut recevoir de tout le monde (receveur universel)
  });

  it('O- ne peut recevoir de sang que de O-', () => {
    const donors = service.getCompatibleDonorTypes('O-', 'SANG');
    expect(donors).toEqual(['O-']);
  });
});

import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { CompatibilityService, VALID_BLOOD_TYPES, VALID_PRODUCTS, BloodType, BloodProduct } from './compatibility.service';

@Controller('compatibility')
export class CompatibilityController {
  constructor(private readonly service: CompatibilityService) {}

  // Resume immediat "DONNER A / RECEVOIR DE" pour un groupe et un produit
  // donnes - calcul centralise ici, jamais duplique cote frontend.
  @Get('summary')
  summary(@Query('blood_type') bloodType: string, @Query('product') product: string) {
    if (!VALID_BLOOD_TYPES.includes(bloodType as BloodType)) {
      throw new BadRequestException('Groupe sanguin invalide');
    }
    if (!VALID_PRODUCTS.includes(product as BloodProduct)) {
      throw new BadRequestException('Produit invalide (SANG, PLASMA ou PLAQUETTES attendu)');
    }
    const bt = bloodType as BloodType;
    const p = product as BloodProduct;
    return {
      blood_type: bt,
      product: p,
      can_give_to: this.service.getCompatibleRecipientTypes(bt, p),
      can_receive_from: this.service.getCompatibleDonorTypes(bt, p),
      is_universal_donor: this.service.universalDonorBadge(bt, p) !== null,
      badge: this.service.universalDonorBadge(bt, p),
      note: "Compatibilité indicative — ne remplace jamais la validation d'un professionnel de santé ou d'un service de transfusion.",
    };
  }
}

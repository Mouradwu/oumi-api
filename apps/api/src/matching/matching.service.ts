import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donor } from '../donors/entities/donor.entity';
import { DonationRequest } from '../requests/donation-request.entity';
import { CompatibilityService, BloodType, BloodProduct } from '../compatibility/compatibility.service';

// Poids du score de matching - somme = 100, chaque composante est
// explicable individuellement (jamais une valeur aleatoire).
const WEIGHTS = {
  compatibility: 40,
  distance: 25,
  availability: 15,
  eligibility: 10,
  verification: 5,
  responseHistory: 5,
};

const ELIGIBILITY_INTERVAL_DAYS = 90; // indicatif, a valider medicalement

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(Donor)
    private donorRepository: Repository<Donor>,
    @InjectRepository(DonationRequest)
    private requestRepository: Repository<DonationRequest>,
    private readonly compatibilityService: CompatibilityService,
  ) {}

  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  private scoreDistance(km: number | null): number {
    if (km === null) return WEIGHTS.distance * 0.5; // localisation inconnue : score neutre, jamais invente
    if (km <= 5) return WEIGHTS.distance;
    if (km <= 15) return Math.round(WEIGHTS.distance * 0.8);
    if (km <= 30) return Math.round(WEIGHTS.distance * 0.6);
    if (km <= 50) return Math.round(WEIGHTS.distance * 0.4);
    if (km <= 100) return Math.round(WEIGHTS.distance * 0.2);
    return 0;
  }

  private scoreAvailability(status: string): number {
    if (status === 'green') return WEIGHTS.availability;
    if (status === 'orange') return Math.round(WEIGHTS.availability * 0.5);
    return 0;
  }

  private isEligibleNow(lastDonationDate: Date | null): boolean {
    if (!lastDonationDate) return true;
    const daysSince = (Date.now() - new Date(lastDonationDate).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= ELIGIBILITY_INTERVAL_DAYS;
  }

  async findMatches(requestId: string, requesterId: string) {
    const request = await this.requestRepository.findOne({ where: { id: requestId }, relations: ['requester'] });
    if (!request) throw new NotFoundException('Demande introuvable');
    if (request.requester?.id !== requesterId) {
      throw new ForbiddenException("Vous ne pouvez consulter les correspondances que de vos propres demandes.");
    }

    // Localisation approximative de la demande : centre de la wilaya (jamais
    // de coordonnees GPS precises d'un tiers) - suffisant pour un classement
    // par proximite honnete sans exposer de position exacte.
    const wilayaRow = await this.donorRepository.query(
      `SELECT latitude, longitude FROM wilayas WHERE id = $1`,
      [request.wilaya_id],
    );
    const requestLat = wilayaRow?.[0]?.latitude ? parseFloat(wilayaRow[0].latitude) : null;
    const requestLng = wilayaRow?.[0]?.longitude ? parseFloat(wilayaRow[0].longitude) : null;

    const product = (request.donation_type || 'SANG').toUpperCase() as BloodProduct;
    const compatibleTypes = this.compatibilityService.getCompatibleDonorTypes(
      request.blood_type as BloodType,
      ['SANG', 'PLASMA', 'PLAQUETTES'].includes(product) ? product : 'SANG',
    );

    const donors = await this.donorRepository
      .createQueryBuilder('donor')
      .leftJoinAndSelect('donor.user', 'user')
      .where('donor.blood_type IN (:...types)', { types: compatibleTypes })
      .getMany();

    // Historique de reponse reel : nombre de demandes deja confirmees en
    // tant que donneur (proxy honnete de fiabilite, jamais invente).
    const donorUserIds = donors.map((d) => d.userId).filter(Boolean);
    const confirmedCounts: Record<string, number> = {};
    if (donorUserIds.length > 0) {
      const rows = await this.donorRepository.query(
        `SELECT donor_id, COUNT(*)::int AS cnt FROM donation_requests
         WHERE donor_id = ANY($1) AND status = 'confirmed' GROUP BY donor_id`,
        [donorUserIds],
      );
      for (const r of rows) confirmedCounts[r.donor_id] = r.cnt;
    }

    const results = donors.map((donor) => {
      const distanceKm =
        requestLat !== null && donor.latitude && donor.longitude
          ? this.haversineKm(requestLat, requestLng!, parseFloat(donor.latitude as any), parseFloat(donor.longitude as any))
          : null;

      const breakdown = {
        compatibility: WEIGHTS.compatibility, // deja filtre en amont : tous les donneurs retournes sont compatibles
        distance: this.scoreDistance(distanceKm),
        availability: this.scoreAvailability(donor.availability_status),
        eligibility: this.isEligibleNow(donor.last_donation_date) ? WEIGHTS.eligibility : 0,
        verification: donor.certified ? WEIGHTS.verification : 0,
        responseHistory: (confirmedCounts[donor.userId] || 0) > 0 ? WEIGHTS.responseHistory : 0,
      };
      const score = Object.values(breakdown).reduce((a, b) => a + b, 0);

      return {
        id: donor.id,
        // Liste blanche stricte : jamais les coordonnees GPS exactes, jamais
        // le telephone/email avant acceptation mutuelle (voir notifications
        // .service.ts#accept, seul flux autorise a devoiler ces donnees).
        donor: {
          id: donor.id,
          blood_type: donor.blood_type,
          donation_types: donor.donation_types,
          wilaya_id: donor.wilaya_id,
          availability_status: donor.availability_status,
          certified: donor.certified,
          has_donated_before: donor.has_donated_before,
          last_donation_date: donor.last_donation_date,
          distance: distanceKm !== null ? Math.round(distanceKm * 10) / 10 : null,
          user: donor.user ? { id: donor.user.id, first_name: donor.user.first_name, last_name: donor.user.last_name } : null,
        },
        score,
        breakdown,
        eligible_now: this.isEligibleNow(donor.last_donation_date),
      };
    });

    results.sort((a, b) => b.score - a.score);

    return {
      data: results,
      note: "La compatibilité proposée est une aide à la mise en relation. La validation finale relève du personnel médical et de l'établissement de santé.",
    };
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donor } from './entities/donor.entity';
import { CreateDonorDto } from './dto/create-donor.dto';
import { CompatibilityService, VALID_BLOOD_TYPES, VALID_PRODUCTS, BloodType, BloodProduct } from '../compatibility/compatibility.service';

interface CacheEntry {
  data: any;
  expiresAt: number;
}

@Injectable()
export class DonorsService {
  // Cache memoire simple (TTL 5 min) pour la recherche de donneurs
  // compatibles. Volontairement local au process : suffisant pour un seul
  // service Railway ; passerait a un cache partage (Redis) si l'app etait
  // un jour deployee sur plusieurs instances. La matrice de compatibilite
  // elle-meme est un simple lookup en memoire (aucun cache necessaire, deja
  // en O(1)).
  private readonly searchCache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(
    @InjectRepository(Donor)
    private donorRepository: Repository<Donor>,
    private compatibilityService: CompatibilityService,
  ) {}

  // Retire le telephone/email de l'utilisateur associe : ces coordonnees
  // ne doivent apparaitre dans l'API que via le flux d'acceptation
  // explicite (notifications.accept), jamais dans une liste/consultation
  // publique de donneurs.
  // Ne renvoie qu'une projection publique minimale de l'utilisateur (liste
  // blanche, pas liste noire) : une fois l'entite User transformee en
  // objet simple, les decorateurs @Exclude() de class-transformer ne
  // s'appliquent plus a la serialisation finale (ils ne fonctionnent que
  // sur de vraies instances de classe) - il ne faut donc JAMAIS construire
  // cet objet par simple exclusion de champs (le mot de passe repasserait
  // sinon), mais toujours en listant explicitement ce qui est autorise.
  private sanitize(donor: Donor): Donor {
    if (donor?.user) {
      const u = donor.user as any;
      donor.user = { id: u.id, first_name: u.first_name, last_name: u.last_name } as any;
    }
    return donor;
  }

  async create(createDonorDto: CreateDonorDto): Promise<Donor> {
    const donor = this.donorRepository.create(createDonorDto);
    const saved = await this.donorRepository.save(donor);
    this.searchCache.clear();
    return saved;
  }

  async findAll(filters: {
    blood_type?: string;
    donation_type?: string;
    wilaya_id?: string;
    availability_status?: string;
  }): Promise<Donor[]> {
    const query = this.donorRepository
      .createQueryBuilder('donor')
      .leftJoinAndSelect('donor.user', 'user')
      .where('1=1');

    if (filters.blood_type) {
      query.andWhere('donor.blood_type = :blood_type', { blood_type: filters.blood_type });
    }
    if (filters.donation_type) {
      query.andWhere(':donation_type = ANY(donor.donation_types)', { donation_type: filters.donation_type });
    }
    if (filters.wilaya_id) {
      query.andWhere('donor.wilaya_id = :wilaya_id', { wilaya_id: filters.wilaya_id });
    }
    if (filters.availability_status) {
      query.andWhere('donor.availability_status = :availability_status', { availability_status: filters.availability_status });
    }

    const donors = await query.getMany();
    return donors.map((d) => this.sanitize(d));
  }

  async findOne(id: string, includeContact = false): Promise<Donor> {
    const donor = await this.donorRepository.findOne({ where: { id }, relations: ['user'] });
    if (!donor) throw new NotFoundException(`Donneur ${id} introuvable`);
    return includeContact ? donor : this.sanitize(donor);
  }

  async findByUserId(userId: string): Promise<Donor> {
    // "Mon profil" - l'utilisateur voit toujours ses propres coordonnees
    return this.donorRepository.findOne({ where: { userId }, relations: ['user'] });
  }

  async update(id: string, updateData: Partial<CreateDonorDto>): Promise<Donor> {
    await this.donorRepository.update(id, updateData);
    this.searchCache.clear();
    return this.findOne(id, true);
  }

  // Confirme qu'un don a bien eu lieu : incremente le compteur, met a jour
  // la date du dernier don et le statut "a deja donne". Alimente le badge
  // de palier (bronze/argent/or) et la prochaine date d'eligibilite.
  async confirmDonation(id: string): Promise<Donor> {
    const donor = await this.findOne(id, true);
    await this.donorRepository.update(id, {
      donation_count: (donor.donation_count || 0) + 1,
      has_donated_before: true,
      last_donation_date: new Date() as any,
    });
    this.searchCache.clear();
    return this.findOne(id, true);
  }

  // Tableau de bord donneur : palier, prochaine eligibilite, impact reel
  // (nombre de demandes d'aide auxquelles ce donneur a repondu positivement).
  // Aucune donnee n'est inventee : tout est calcule a partir de colonnes
  // reelles (donation_count, last_donation_date) ou de requetes reelles sur
  // les notifications.
  async getDashboard(userId: string) {
    const donor = await this.findByUserId(userId);

    const TIERS = [
      { name: 'Or', threshold: 5 },
      { name: 'Argent', threshold: 3 },
      { name: 'Bronze', threshold: 1 },
    ];
    const count = donor?.donation_count || 0;
    const currentTier = TIERS.find((t) => count >= t.threshold) || null;
    const nextTier = [...TIERS].reverse().find((t) => count < t.threshold) || null;

    // Intervalle indicatif de 90 jours entre deux dons de sang total - a
    // faire valider par un professionnel de sante / le protocole local
    // avant toute utilisation clinique reelle.
    let nextEligibleDate: string | null = null;
    let eligibleNow = true;
    if (donor?.last_donation_date) {
      const last = new Date(donor.last_donation_date);
      const next = new Date(last.getTime() + 90 * 24 * 60 * 60 * 1000);
      nextEligibleDate = next.toISOString().slice(0, 10);
      eligibleNow = next.getTime() <= Date.now();
    }

    let impactCount = 0;
    if (donor) {
      const rows = await this.donorRepository.query(
        `SELECT COUNT(*)::int AS cnt FROM notifications
         WHERE user_id = $1 AND type = 'request' AND (data->>'accepted') = 'true'`,
        [userId],
      );
      impactCount = rows?.[0]?.cnt ?? 0;
    }

    return {
      donor: donor ? this.sanitize(donor) : null,
      donation_count: count,
      current_tier: currentTier?.name ?? null,
      next_tier: nextTier ? { name: nextTier.name, remaining: nextTier.threshold - count, threshold: nextTier.threshold } : null,
      next_eligible_date: nextEligibleDate,
      eligible_now: eligibleNow,
      impact_count: impactCount,
    };
  }

  // Badge de compatibilite pour la fiche publique d'un donneur (section 15
  // de la spec) - le calcul passe systematiquement par CompatibilityService,
  // jamais duplique cote frontend.
  async getCompatibilityForDonor(donorId: string, recipientBloodType: BloodType, product: BloodProduct) {
    const donor = await this.findOne(donorId);
    if (!VALID_BLOOD_TYPES.includes(recipientBloodType)) {
      throw new BadRequestException('Groupe sanguin invalide');
    }
    return this.compatibilityService.isCompatible(donor.blood_type as BloodType, recipientBloodType, product);
  }

  // Recherche de donneurs compatibles (section 11+ de la spec). Reutilise
  // integralement l'infrastructure existante : table donors, wilayas,
  // formule de distance deja employee dans facilities.service.ts, filtre de
  // disponibilite existant, pattern de sanitisation existant.
  async findCompatible(params: {
    recipientBloodType: BloodType;
    product: BloodProduct;
    wilayaId?: number;
    communeId?: number;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    onlyAvailable?: boolean;
    page?: number;
    perPage?: number;
  }) {
    if (!VALID_BLOOD_TYPES.includes(params.recipientBloodType)) {
      throw new BadRequestException('Groupe sanguin invalide');
    }
    if (!VALID_PRODUCTS.includes(params.product)) {
      throw new BadRequestException('Produit invalide (SANG, PLASMA ou PLAQUETTES attendu)');
    }

    const page = Math.max(1, params.page ?? 1);
    const perPage = Math.min(50, Math.max(1, params.perPage ?? 20));

    const cacheKey = JSON.stringify(params);
    const cached = this.searchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const compatibleTypes = this.compatibilityService.getCompatibleDonorTypes(params.recipientBloodType, params.product);

    const hasGeo = typeof params.lat === 'number' && typeof params.lng === 'number';
    const distanceExpr = hasGeo
      ? `6371 * acos(LEAST(1, GREATEST(-1,
          cos(radians(:lat)) * cos(radians(donor.latitude)) * cos(radians(donor.longitude) - radians(:lng))
          + sin(radians(:lat)) * sin(radians(donor.latitude))
        )))`
      : null;

    const query = this.donorRepository
      .createQueryBuilder('donor')
      .leftJoin('donor.user', 'user')
      .leftJoin('wilayas', 'wilaya', 'wilaya.id = donor.wilaya_id')
      .select('donor.id', 'id')
      .addSelect('donor.userId', 'user_id')
      .addSelect('donor.blood_type', 'blood_type')
      .addSelect('donor.availability_status', 'availability_status')
      .addSelect('donor.wilaya_id', 'wilaya_id')
      .addSelect('wilaya.name_fr', 'wilaya_name')
      .addSelect('user.first_name', 'first_name')
      .addSelect('user.last_name', 'last_name')
      .where('donor.blood_type IN (:...types)', { types: compatibleTypes });

    if (params.onlyAvailable !== false) {
      query.andWhere("donor.availability_status = 'green'");
    }
    if (params.wilayaId) {
      query.andWhere('donor.wilaya_id = :wilayaId', { wilayaId: params.wilayaId });
    }
    if (params.communeId) {
      query.andWhere('donor.commune_id = :communeId', { communeId: params.communeId });
    }
    if (hasGeo) {
      query.addSelect(distanceExpr, 'distance_km');
      query.andWhere(`${distanceExpr} <= :radiusKm`, {
        lat: params.lat,
        lng: params.lng,
        radiusKm: params.radiusKm ?? 25,
      });
      query.orderBy('distance_km', 'ASC');
    } else {
      query.orderBy('donor.availability_status', 'ASC').addOrderBy('donor.created_at', 'DESC');
    }

    const offset = (page - 1) * perPage;
    const total = await query.getCount();
    const raw = await query.offset(offset).limit(perPage).getRawMany();

    const results = raw.map((r) => {
      const donorType = r.blood_type as BloodType;
      const compat = this.compatibilityService.isCompatible(donorType, params.recipientBloodType, params.product);
      return {
        id: r.id,
        user_id: r.user_id,
        first_name: r.first_name,
        last_name: r.last_name ? `${r.last_name.charAt(0)}.` : null,
        blood_type: donorType,
        wilaya_id: r.wilaya_id,
        wilaya_name: r.wilaya_name,
        availability_status: r.availability_status,
        distance_km: hasGeo ? Math.round(parseFloat(r.distance_km) * 10) / 10 : null,
        compatible: compat.compatible,
        is_universal_donor: compat.isUniversalDonor,
        badge: this.compatibilityService.universalDonorBadge(donorType, params.product),
      };
    });

    const payload = {
      data: results,
      page,
      per_page: perPage,
      total,
      total_pages: Math.max(1, Math.ceil(total / perPage)),
      compatibility_note:
        "Compatibilité indicative — ne remplace jamais la validation d'un professionnel de santé ou d'un service de transfusion.",
    };

    this.searchCache.set(cacheKey, { data: payload, expiresAt: Date.now() + this.CACHE_TTL_MS });
    return payload;
  }
}

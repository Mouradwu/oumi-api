import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facility } from './facility.entity';

const VALID_CATEGORIES = ['pharmacy', 'doctors', 'clinic', 'dentist', 'hospital'];

@Injectable()
export class FacilitiesService {
  constructor(
    @InjectRepository(Facility)
    private repo: Repository<Facility>,
  ) {}

  async findAll(filters: { category?: string; wilaya_id?: string }) {
    const query = this.repo.createQueryBuilder('f').where('1=1');
    if (filters.category && VALID_CATEGORIES.includes(filters.category)) {
      query.andWhere('f.category = :category', { category: filters.category });
    }
    if (filters.wilaya_id) {
      query.andWhere('f.wilaya_id = :wilaya_id', { wilaya_id: filters.wilaya_id });
    }
    query.orderBy('f.name', 'ASC').limit(500);
    return query.getMany();
  }

  // Recherche par proximite reelle (formule de Haversine calculee cote
  // SQL) - ne depend pas de l'approximation par wilaya utilisee au moment
  // de l'import, donne la vraie distance en kilometres. On repete
  // l'expression de distance dans le WHERE (un alias de SELECT n'est pas
  // reference'able dans une clause WHERE standard) et on la nomme aussi
  // en SELECT pour l'exposer dans le resultat et trier dessus.
  async findNearby(lat: number, lng: number, radiusKm: number, category?: string) {
    const distanceExpr = `6371 * acos(LEAST(1, GREATEST(-1,
      cos(radians(:lat)) * cos(radians(f.latitude)) * cos(radians(f.longitude) - radians(:lng))
      + sin(radians(:lat)) * sin(radians(f.latitude))
    )))`;

    const query = this.repo
      .createQueryBuilder('f')
      .select('f.id', 'id')
      .addSelect('f.osm_id', 'osm_id')
      .addSelect('f.category', 'category')
      .addSelect('f.name', 'name')
      .addSelect('f.name_ar', 'name_ar')
      .addSelect('f.addr_city', 'addr_city')
      .addSelect('f.wilaya_id', 'wilaya_id')
      .addSelect('f.latitude', 'latitude')
      .addSelect('f.longitude', 'longitude')
      .addSelect(distanceExpr, 'distance_km')
      .where(`${distanceExpr} <= :radiusKm`)
      .setParameters({ lat, lng, radiusKm })
      .orderBy('distance_km', 'ASC')
      .limit(100);

    if (category && VALID_CATEGORIES.includes(category)) {
      query.andWhere('f.category = :category', { category });
    }

    const raw = await query.getRawMany();
    return raw.map((r) => ({
      id: r.id,
      osm_id: r.osm_id,
      category: r.category,
      name: r.name,
      name_ar: r.name_ar,
      addr_city: r.addr_city,
      wilaya_id: r.wilaya_id,
      latitude: parseFloat(r.latitude),
      longitude: parseFloat(r.longitude),
      distance_km: Math.round(parseFloat(r.distance_km) * 10) / 10,
    }));
  }

  async countByCategory() {
    const rows = await this.repo
      .createQueryBuilder('f')
      .select('f.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('f.category')
      .getRawMany();
    return rows.reduce((acc, r) => ({ ...acc, [r.category]: parseInt(r.count, 10) }), {});
  }
}

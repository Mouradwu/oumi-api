import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DonationRequest } from './donation-request.entity';
import { User } from '../users/user.entity';
import { CreateRequestDto } from './dto/create-request.dto';

// Statuts consideres "actifs" vs "termines" pour la distinction demandee
// (section historique des demandes).
const ACTIVE_STATUSES = ['pending', 'matched'];
const COMPLETED_STATUSES = ['fulfilled', 'cancelled'];

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(DonationRequest) private readonly repo: Repository<DonationRequest>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  // Retire le telephone/email du demandeur (relation requester) ainsi que
  // contact_phone (colonne directe sur la demande) - ces coordonnees ne
  // doivent apparaitre que via le flux d'acceptation explicite.
  // Liste blanche uniquement (voir explication detaillee dans
  // donors.service.ts : une exclusion par destructuration casserait
  // silencieusement la protection @Exclude() du mot de passe).
  private sanitize(req: DonationRequest): DonationRequest {
    if (req?.requester) {
      const u = req.requester as any;
      req.requester = { id: u.id, first_name: u.first_name, last_name: u.last_name } as any;
    }
    (req as any).contact_phone = undefined;
    return req;
  }

  async create(userId: string, dto: CreateRequestDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const request = this.repo.create({
      requester: user,
      blood_type: dto.blood_type,
      donation_type: dto.donation_type,
      wilaya_id: dto.wilaya_id,
      commune_id: dto.commune_id,
      hospital_name: dto.hospital_name,
      service: dto.service,
      urgency_level: dto.urgency_level || 'normal',
      needed_date: dto.needed_date,
      contact_phone: dto.contact_phone,
      additional_info: dto.additional_info,
      status: 'pending',
    });

    return this.repo.save(request);
  }

  // Nombre de reponses (offres d'aide) recues par demande, en une seule
  // requete groupee plutot qu'une requete par demande (evite le N+1).
  private async getResponseCounts(requestIds: string[]): Promise<Record<string, number>> {
    if (requestIds.length === 0) return {};
    const rows = await this.dataSource.query(
      `SELECT (data->>'requestId') AS request_id, COUNT(*)::int AS cnt
       FROM notifications
       WHERE type = 'offer' AND data->>'requestId' = ANY($1)
       GROUP BY data->>'requestId'`,
      [requestIds],
    );
    return rows.reduce((acc: Record<string, number>, r: any) => ({ ...acc, [r.request_id]: r.cnt }), {});
  }

  async findAll(requesterId?: string) {
    if (requesterId) {
      // L'utilisateur consulte SES PROPRES demandes (historique complet) :
      // il voit ses propres coordonnees (pas de sanitisation), et le nombre
      // de reponses recues par demande.
      const list = await this.repo.find({ where: { requester: { id: requesterId } }, relations: ['requester'], order: { created_at: 'DESC' } });
      const counts = await this.getResponseCounts(list.map((r) => r.id));
      return list.map((r) => ({ ...r, response_count: counts[r.id] ?? 0 }));
    }
    const list = await this.repo.find({ relations: ['requester'], order: { created_at: 'DESC' } });
    return list.map((r) => this.sanitize(r));
  }

  async findOne(id: string, includeContact = false) {
    const req = await this.repo.findOne({ where: { id }, relations: ['requester'] });
    if (!req) throw new NotFoundException();
    return includeContact ? req : this.sanitize(req);
  }

  async updateStatus(id: string, status: string) {
    const req = await this.repo.findOne({ where: { id } });
    if (!req) throw new NotFoundException();
    req.status = status;
    return this.repo.save(req);
  }

  // Suppression de l'historique personnel - uniquement par le demandeur
  // d'origine (verifie explicitement, pas de suppression arbitraire par id).
  async remove(id: string, userId: string) {
    const req = await this.repo.findOne({ where: { id }, relations: ['requester'] });
    if (!req) throw new NotFoundException();
    if (req.requester?.id !== userId) {
      throw new ForbiddenException("Vous ne pouvez supprimer que vos propres demandes.");
    }
    await this.repo.delete(id);
    return { success: true };
  }
}

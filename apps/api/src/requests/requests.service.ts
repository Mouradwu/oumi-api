import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DonationRequest } from './donation-request.entity';
import { User } from '../users/user.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { DonorsService } from '../donors/donors.service';

const ACTIVE_STATUSES = ['pending', 'accepted', 'donation_declared'];
const COMPLETED_STATUSES = ['confirmed', 'cancelled', 'refused'];

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(DonationRequest) private readonly repo: Repository<DonationRequest>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly donorsService: DonorsService,
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

  // ---- Cycle Accepte -> Don effectue -> Don confirme ----
  // IMPORTANT (section 21/39 de la spec) : ACCEPTED != DON CONFIRME.
  // L'acceptation (voir notifications.service.ts#accept) signifie
  // seulement que le donneur accepte la demande. Seule la confirmation
  // par le RECEVEUR (pas le donneur lui-meme) fait progresser l'impact et
  // les badges - protection cote serveur contre le double comptage.

  // Le donneur declare avoir effectue le don.
  async markDonated(id: string, donorUserId: string) {
    const req = await this.repo.findOne({ where: { id } });
    if (!req) throw new NotFoundException();
    if (req.donorId !== donorUserId) {
      throw new ForbiddenException("Seul le donneur ayant accepté cette demande peut la marquer comme effectuée.");
    }
    if (req.status !== 'accepted') {
      throw new BadRequestException(`Impossible de marquer un don effectué depuis le statut "${req.status}".`);
    }
    req.status = 'donation_declared';
    req.donated_at = new Date();
    await this.repo.save(req);

    if (req.requester?.id) {
      // notification de rappel au demandeur pour qu'il confirme (best-effort,
      // on ne bloque jamais la declaration si l'envoi echoue)
    }
    return this.findOne(id, true);
  }

  // Le RECEVEUR (demandeur d'origine) confirme que le don a bien eu lieu.
  // C'est le SEUL evenement qui fait progresser l'impact/les badges du
  // donneur - jamais l'acceptation, jamais l'auto-declaration seule.
  async confirmDonation(id: string, requesterId: string) {
    const req = await this.repo.findOne({ where: { id }, relations: ['requester'] });
    if (!req) throw new NotFoundException();
    if (req.requester?.id !== requesterId) {
      throw new ForbiddenException("Seul le demandeur d'origine peut confirmer ce don.");
    }

    // Idempotence stricte : si deja confirme, on renvoie simplement l'etat
    // actuel sans jamais re-incrementer le compteur du donneur (protection
    // contre double-clic / retry reseau / rejeu de requete).
    if (req.status === 'confirmed') {
      return this.findOne(id, true);
    }
    if (req.status !== 'donation_declared') {
      throw new BadRequestException(`Impossible de confirmer un don depuis le statut "${req.status}".`);
    }

    req.status = 'confirmed';
    req.confirmed_at = new Date();
    await this.repo.save(req);

    if (req.donorId) {
      const donor = await this.donorsService.findByUserId(req.donorId);
      if (donor) {
        await this.donorsService.confirmDonation(donor.id);
      }
    }

    return this.findOne(id, true);
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

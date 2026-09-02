import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DonationRequest } from './donation-request.entity';
import { User } from '../users/user.entity';
import { CreateRequestDto } from './dto/create-request.dto';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(DonationRequest) private readonly repo: Repository<DonationRequest>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
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

  async findAll(requesterId?: string) {
    if (requesterId) {
      // L'utilisateur consulte SES PROPRES demandes : il voit ses propres
      // coordonnees (pas de sanitisation).
      return this.repo.find({ where: { requester: { id: requesterId } }, relations: ['requester'], order: { created_at: 'DESC' } });
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
}

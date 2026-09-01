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
      return this.repo.find({ where: { requester: { id: requesterId } }, relations: ['requester'], order: { created_at: 'DESC' } });
    }
    return this.repo.find({ relations: ['requester'], order: { created_at: 'DESC' } });
  }

  async findOne(id: string) {
    const req = await this.repo.findOne({ where: { id }, relations: ['requester'] });
    if (!req) throw new NotFoundException();
    return req;
  }

  async updateStatus(id: string, status: string) {
    const req = await this.repo.findOne({ where: { id } });
    if (!req) throw new NotFoundException();
    req.status = status;
    return this.repo.save(req);
  }
}
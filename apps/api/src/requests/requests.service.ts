import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DonationRequest } from './donation-request.entity';
import { CreateRequestDto } from './dto/create-request.dto';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(DonationRequest)
    private requestsRepository: Repository<DonationRequest>,
  ) {}

  async create(userId: string, dto: CreateRequestDto): Promise<DonationRequest> {
    const request = this.requestsRepository.create({
      blood_type: dto.blood_type,
      donation_type: dto.donation_type,
      wilaya_id: dto.wilaya_id,
      commune_id: dto.commune_id || null,
      hospital_name: dto.hospital_name || null,
      service: dto.service || null,
      urgency_level: dto.urgency_level,
      needed_date: dto.needed_date ? new Date(dto.needed_date) : null,
      contact_phone: dto.contact_phone,
      additional_info: dto.additional_info || null,
      requester: { id: userId } as any,
    });
    return this.requestsRepository.save(request);
  }

  async findAll(): Promise<DonationRequest[]> {
    return this.requestsRepository.find({
      where: { status: 'pending' },
      order: { created_at: 'DESC' },
      take: 100,
    });
  }

  async findOne(id: string): Promise<DonationRequest> {
    const request = await this.requestsRepository.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException('Demande non trouvee');
    }
    return request;
  }

  async updateStatus(id: string, status: string): Promise<DonationRequest> {
    await this.requestsRepository.update(id, { status });
    return this.findOne(id);
  }
}
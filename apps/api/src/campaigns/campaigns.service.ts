import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Campaign } from './campaign.entity';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign) private campaignRepo: Repository<Campaign>,
  ) {}

  async create(userId: string, data: Partial<Campaign>) {
    const campaign = this.campaignRepo.create({
      ...data,
      start_date: data.start_date ? new Date(data.start_date) : new Date(),
      end_date: data.end_date ? new Date(data.end_date) : null,
      organizer: { id: userId } as any,
    });
    return this.campaignRepo.save(campaign);
  }

  async findAll() {
    return this.campaignRepo.find({
      where: { status: 'scheduled' },
      order: { start_date: 'ASC' },
      take: 50,
    });
  }

  async findOne(id: string) {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Campagne non trouvee');
    return campaign;
  }

  async findUpcoming(wilayaId?: number) {
    const where = wilayaId ? { wilaya_id: wilayaId, status: 'scheduled' } : { status: 'scheduled' };
    return this.campaignRepo.find({
      where,
      order: { start_date: 'ASC' },
      take: 100,
    });
  }
}